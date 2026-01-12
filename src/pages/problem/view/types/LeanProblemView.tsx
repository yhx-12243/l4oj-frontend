import React, { useEffect, useRef, useState } from "react";
import { Form, Icon, Label, Message, Popup } from "semantic-ui-react";
import { observer } from "mobx-react";

import style from "./LeanProblemView.module.less";

import { useLocalizer } from "@/utils/hooks";

import { DEFAULT_AXIOMS, JudgeInfoLean } from "../../judge-settings/types/LeanProblemEditor";
import { ProblemTypeLabelsProps, ProblemTypeSubmitViewProps, ProblemTypeView } from "../common/interface";
import SubmitViewFrame from "../common/SubmitViewFrame";
import api from "@/api";
import toast from "@/utils/toast";
import { isValidLeanName } from "@/utils/validators";

type LeanProblemLabelsProps = ProblemTypeLabelsProps<JudgeInfoLean>;

const LeanProblemLabels: React.FC<LeanProblemLabelsProps> = React.memo(props => {
  const _ = useLocalizer("problem");

  const defaultSet = new Set(DEFAULT_AXIOMS.values().map(axiom => axiom.name));
  const mySet = new Set(props.judgeInfo.axioms.values().map(axiom => axiom.name));
  const exactDefault = !defaultSet.difference(mySet).size;

  return (
    <>
      {exactDefault
        ? <Popup
          trigger={
            <Label size={props.size}>
              <Icon name="file" />
              {_('.axioms.default')}
            </Label>
          }
          content={
            <table>
              <tbody>
                {DEFAULT_AXIOMS.map(axiom =>
                  <tr key={axiom.name}>
                    <td><a href={axiom.url}>{axiom.name}</a></td>
                  </tr>
                )}
              </tbody>
            </table>
          }
          hoverable
          on="hover"
          position="bottom center"
        />
        : DEFAULT_AXIOMS
          .filter(axiom => !mySet.has(axiom.name))
          .map(axiom =>
            <Label key={axiom.name} size={props.size} color="red">
              <Icon name="ban" />
              {axiom.url ? <a className={style.axiomLink} href={axiom.url}>{axiom.name}</a> : axiom.name}
            </Label>
          )
      }
      {props.judgeInfo.axioms
        .filter(axiom => !defaultSet.has(axiom.name))
        .map(axiom =>
          <Label key={axiom.name} size={props.size} color="green">
            <Icon name="disk" />
            {axiom.url ? <a className={style.axiomLink} href={axiom.url}>{axiom.name}</a> : axiom.name}
          </Label>
        )
      }
    </>
  );
});

interface SubmissionContent {
  moduleName: string;
  constName: string;
}

type LeanProblemSubmitViewProps = ProblemTypeSubmitViewProps<JudgeInfoLean, SubmissionContent>;

interface LeanDependencyLinkProps {
  dependency: string;
}

const LeanDependencyLink: React.FC<LeanDependencyLinkProps> = ({ dependency }) => {
  const
    dpath = dependency.replaceAll('.', '/'),
    isOjLib = dependency.toLowerCase() === 'lean4oj' || dependency.toLowerCase().startsWith('lean4oj.');
  let url = `/lean/${isOjLib ? 'Lean4OJ/' : ''}${dpath}`;
  url = url.substring(0, url.lastIndexOf('/') + 1);

  for (const std of ['aesop', 'archive', 'batteries', 'counterexamples', 'importgraph', 'init', 'lake', 'lean', 'leansearchclient', 'mathlib', 'plausible', 'proofwidgets', 'std', 'docs', 'references']) {
    if (dependency.toLowerCase() === std || dependency.toLowerCase().startsWith(std + '.')) {
      url = `https://leanprover-community.github.io/mathlib4_docs/${dpath}.html`;
      break;
    }
  }

  return (
    <a href={url}>
      <code>{dependency}</code>
    </a>
  );
};

let LeanProblemSubmitView: React.FC<LeanProblemSubmitViewProps> = props => {
  const _ = useLocalizer('problem');

  const [pending, setPending] = useState(false);
  const refInput = useRef('');

  const [allConsts, setAllConsts] = useState([]);
  const [dependencies, setDependencies] = useState([]);

  useEffect(() => {
    if (props.submissionContent.moduleName)
      updateModuleName();
  }, []);

  const updateModuleName = async () => {
    const input = props.submissionContent.moduleName.trim().replaceAll('/', '.');
    props.onUpdateSubmissionContent('moduleName', input);

    setPending(true);
    refInput.current = input;

    if (!isValidLeanName(input)) {
      setAllConsts([]);
      setDependencies([]);
      props.onUpdateSubmissionContent('constName', '');
      setPending(false);
      return;
    }

    const { requestError, response } = await api.submission.getOleanMeta({ moduleName: input });

    if (refInput.current !== input) {
      // Still pending
      return;
    }

    if (requestError) {
      toast.error(requestError(_));
      setAllConsts([]);
      setDependencies([]);
      props.onUpdateSubmissionContent('constName', '');
    } else {
      setAllConsts(response.consts);
      if (props.submissionContent.constName && !response.consts.includes(props.submissionContent.constName))
        props.onUpdateSubmissionContent('constName', '');
      setDependencies(response.dependencies);
    }
    setPending(false);
  };

  return (
    <SubmitViewFrame
      {...props}
      showSkipSamples={false}
      mainContent={
        <Form>
          <Form.Input
            label={_('.submit.module_name')}
            placeholder={_('.submit.module_name_example')}
            onChange={(_, { value }) => {
              props.onUpdateSubmissionContent('moduleName', value);
            }}
            onBlur={() => updateModuleName()}
            value={props.submissionContent.moduleName}
          />
          <Form.Select
            label={_('.submit.const_name')}
            search
            placeholder={_('.submit.const_name_example')}
            noResultsMessage={_(".submit.no_addable_consts")}
            selectOnBlur={false}
            selectOnNavigation={false}
            clearable
            options={allConsts.map(Const => ({ text: Const, value: Const }))}
            onChange={(_, { value }) => {
              props.onUpdateSubmissionContent('constName', value);
            }}
            loading={pending}
            value={props.submissionContent.constName}
          />
          {dependencies.length || pending ? <Message
            className={style.dependencies}
            icon={pending ? 'circle notched loading' : null}
            info
            header={_('.submit.dependency_list')}
            list={dependencies.map(dependency =>
              <Message.Item>
                <LeanDependencyLink dependency={dependency} />
              </Message.Item>
            )}
          /> : null}
        </Form>
      }
      sidebarContent={null}
      submitDisabled={!(
        isValidLeanName(props.submissionContent.moduleName) &&
        isValidLeanName(props.submissionContent.constName)
      )}
    />
  );
};

LeanProblemSubmitView = observer(LeanProblemSubmitView);

const leanProblemViews: ProblemTypeView<JudgeInfoLean> = {
  Labels: LeanProblemLabels,
  SubmitView: LeanProblemSubmitView,
  getDefaultSubmissionContent: () => ({
    moduleName: '',
    constName: '',
  }),
  isSubmittable: () => true,
  enableStatistics: () => true
};

export default leanProblemViews;
