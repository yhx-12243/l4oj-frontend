import React from "react";

import style from "../SubmissionPage.module.less";

import { useLocalizer } from "@/utils/hooks";
import { OmittableAnsiCodeBox } from "@/components/CodeBox";
import { ProblemTypeSubmissionViewProps, ProblemTypeSubmissionViewHelper } from "../common/interface";

interface SubmissionTestcaseResultLean {
  status: string,
  score: number,
}

interface SubmissionContentLean {
  hash: string,
  leanVersion: string,
}

type LeanProblemSubmissionViewProps = ProblemTypeSubmissionViewProps<
  SubmissionTestcaseResultLean,
  SubmissionContentLean
>;

const LeanProblemSubmissionView: React.FC<LeanProblemSubmissionViewProps> = props => {
  const _ = useLocalizer("submission");

  return (
    <OmittableAnsiCodeBox
      title={_(".system_message")}
      ansiMessage={props.progressMeta.message}
    />
  )
};

const helper: ProblemTypeSubmissionViewHelper<SubmissionContentLean> = {
  config: {
    hideTimeMemory: true,
  },
  getAnswerInfo(content, _) {
    return (
      <table className={style.compileAndRunOptions}>
        <tbody>
          <tr>
            <td align="right" className={style.compileAndRunOptionsName}>
              <strong>SHA256</strong>
            </td>
            <td>
              {content.hash}
            </td>
          </tr>
          <tr>
            <td align="right" className={style.compileAndRunOptionsName}>
              <strong>{_('.lean_version')}</strong>
            </td>
            <td>
              {content.leanVersion}
            </td>
          </tr>
        </tbody>
      </table>
    )
  },
}

export default Object.assign(LeanProblemSubmissionView, helper);
