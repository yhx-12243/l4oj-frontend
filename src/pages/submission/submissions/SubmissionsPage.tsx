import React, { useEffect, useState, useRef } from "react";
import { Table, Form, Icon, Button, Segment, Header } from "semantic-ui-react";
import { observer } from "mobx-react";
import { v4 as uuid } from "uuid";
import { patch } from "jsondiffpatch";

import style from "./SubmissionsPage.module.less";

import api from "@/api";
import { appState } from "@/appState";
import {
  useLocalizer,
  useFieldCheckSimple,
  useSocket,
  useScreenWidthWithin,
  useNavigationChecked
} from "@/utils/hooks";
import toast from "@/utils/toast";
import { CodeLanguage } from "@/interfaces/CodeLanguage";
import { SubmissionStatus } from "@/interfaces/SubmissionStatus";
import { isValidIdentifier } from "@/utils/validators";
import StatusText from "@/components/StatusText";
import {
  isSettledStatus,
  SubmissionItem,
  SubmissionItemMobile,
  SubmissionHeader,
  SubmissionHeaderMobile
} from "../componments/SubmissionItem";
import { SimplePagination } from "@/components/Pagination";
import { defineRoute, RouteError } from "@/AppRouter";
import { SubmissionProgressMessageMetaOnly, SubmissionProgressType } from "../common";

const SUBMISSIONS_PER_PAGE = appState.serverPreference.pagination.submissions;

interface SubmissionsQuery {
  problemId: number;
  problemDisplayId: number;
  submitter: string;
  leanVersion: string;
  status: SubmissionStatus;
  minId: number;
  maxId: number;
}

function normalizeQuery(query: Record<string, string>): SubmissionsQuery {
  const result: SubmissionsQuery = {
    problemId: Number(query.problemId) ? Number(query.problemId) : null,
    problemDisplayId:
      Number(query.problemDisplayId) && !Number(query.problemId) ? Number(query.problemDisplayId) : null,
    submitter: isValidIdentifier(query.submitter) ? query.submitter : null,
    leanVersion: appState.serverPreference.misc.leanVersions.includes(query.leanVersion) ? query.leanVersion : null,
    status: query.status in SubmissionStatus ? (query.status as SubmissionStatus) : null,
    minId: Number.isSafeInteger(Number(query.minId)) ? Number(query.minId) : null,
    maxId: Number.isSafeInteger(Number(query.maxId)) ? Number(query.maxId) : null
  };
  return Object.fromEntries(Object.entries(result).filter(([key, value]) => value != null)) as SubmissionsQuery;
}

async function fetchData(query: SubmissionsQuery) {
  const { requestError, response } = await api.submission.querySubmission({
    ...query,
    locale: appState.locale,
    takeCount: SUBMISSIONS_PER_PAGE
  });

  if (requestError) throw new RouteError(requestError, { showRefresh: true, showBack: true });

  return response;
}

interface SubmissionsPageProps {
  query: SubmissionsQuery;
  queryResult: ApiTypes.QuerySubmissionResponseDto;
}

let SubmissionsPage: React.FC<SubmissionsPageProps> = props => {
  const _ = useLocalizer("submissions");
  const navigation = useNavigationChecked();

  useEffect(() => {
    appState.enterNewPage(_(".title"), "submissions");
  }, [appState.locale]);

  useEffect(() => {
    if (props.queryResult.error) toast.error(_(`.query_error.${props.queryResult.error}`));
  }, []);

  const [queryProblemId, setQueryProblemId] = useState(
    props.query.problemDisplayId
      ? props.query.problemDisplayId.toString()
      : props.query.problemId
      ? "P" + props.query.problemId
      : ""
  );
  const [checkQueryProblemId, queryProblemIdError] = useFieldCheckSimple(queryProblemId, value => {
    if (value.toUpperCase().startsWith("P") && Number.isSafeInteger(Number(value.substr(1)))) return true;
    if (Number.isSafeInteger(Number(value))) return true;
    return false;
  });

  const [querySubmitter, setQuerySubmitter] = useState(props.query.submitter || "");
  const [checkQuerySubmitter, querySubmitterError] = useFieldCheckSimple(
    querySubmitter,
    value => !value || isValidIdentifier(value)
  );

  const [queryCodeLanguage, setQueryCodeLanguage] = useState(props.query.leanVersion);
  const [queryStatus, setQueryStatus] = useState(props.query.status);

  function onFilter(filterMySubmissions: boolean) {
    if (!checkQueryProblemId()) return toast.error(_(".query_error.INVALID_PROBLEM_ID"));
    else if (!filterMySubmissions && !checkQuerySubmitter()) return toast.error(_(".query_error.INVALID_USERNAME"));

    const query: Partial<SubmissionsQuery> = {};
    if (queryProblemId && queryProblemId.toUpperCase().startsWith("P"))
      query.problemId = Number(queryProblemId.substr(1));
    if (queryProblemId && !queryProblemId.toUpperCase().startsWith("P"))
      query.problemDisplayId = Number(queryProblemId);
    if (filterMySubmissions) query.submitter = appState.currentUser.username;
    else if (querySubmitter) query.submitter = querySubmitter;
    if (queryCodeLanguage) query.leanVersion = queryCodeLanguage;
    if (queryStatus) query.status = queryStatus;

    navigation.navigate({
      query: Object.fromEntries(Object.entries(query).map(([key, value]) => [key, value.toString()]))
    });
  }

  const [submissions, setSubmissions] = useState(props.queryResult.submissions || []);

  // Subscribe to submission progress with the key
  const pendingSubmissions = submissions.flatMap(submission => isSettledStatus(submission.status) ? [] : [submission.id]);
  // Save the messages to a map, since we receive message delta each time
  const messagesMapRef = useRef<Map<number, SubmissionProgressMessageMetaOnly>>();
  useSocket(
    "api/submission/subscribeSubmissions",
    new URLSearchParams(pendingSubmissions.map(id => ['ids', id.toString()])),
    socket => {
      socket.addEventListener("update", event => {
        const message = JSON.parse(event.data);
        setSubmissions(submissions => {
          const newSubmissions = [...submissions];
          for (const i in newSubmissions) {
            if (event.lastEventId === newSubmissions[i].id.toString()) {
              const meta = { ...newSubmissions[i] };
              if (message.Status) {
                const [newStatus, action] = message.Status;
                meta.status = newStatus;
                if (action.Replace) meta.message = action.Replace;
                else if (action.Append) meta.message += action.Append;
              }
              if (message.Answer) {
                meta.answerObj = message.Answer;
              }
              newSubmissions[i] = meta;
            }
          }
          return newSubmissions;
        });
      });
    },
    () => {
      // Server maintains the "previous" messages for each connection,
      // so clear the local "previous" messages after reconnection
      console.log("connected");
      messagesMapRef.current = new Map();
    },
    !!pendingSubmissions.length
  );

  const hasPrevPage = props.queryResult.hasLargerId;
  const hasNextPage = props.queryResult.hasSmallerId;

  function pageUrl(direction: -1 | 1) {
    const query = Object.assign({}, props.query);
    if (direction === -1) {
      query.minId = submissions[0].id + 1;
      delete query.maxId;
    } else {
      query.maxId = submissions[submissions.length - 1].id - 1;
      delete query.minId;
    }

    return {
      query: Object.fromEntries(Object.entries(query).map(([key, value]) => [key, value.toString()]))
    };
  }

  const isWideScreen = useScreenWidthWithin(1024, Infinity);
  const isMobile = useScreenWidthWithin(0, 768);

  return (
    <>
      <Form className={style.queryForm}>
        <Form.Group inline unstackable>
          <Form.Input
            className={style.queryInputProblemId}
            icon="hashtag"
            iconPosition="left"
            placeholder={_(".query.problem_id")}
            value={queryProblemId}
            onChange={(e, { value }) => setQueryProblemId(value)}
            onBlur={checkQueryProblemId}
            error={queryProblemIdError}
          />
          <Form.Input
            className={style.queryInputSubmitter}
            icon="user"
            iconPosition="left"
            placeholder={_(".query.submitter")}
            value={querySubmitter}
            onChange={(e, { value }) => setQuerySubmitter(value)}
            onBlur={checkQuerySubmitter}
            error={querySubmitterError}
          />
          <Form.Select
            className={
              style.queryInputCodeLanguage + " " + style.select + (!queryCodeLanguage ? " " + style.selectedAll : "")
            }
            value={queryCodeLanguage || "ALL"}
            onChange={(e, { value }) => setQueryCodeLanguage(value === "ALL" ? null : (value as CodeLanguage))}
            options={[
              {
                key: "",
                value: "ALL",
                text: (
                  <>
                    <Icon name="chartline" />
                    <span className={style.notInMenu}>{_(".query.lean_version")}</span>
                    <span className={style.inMenu}>{_(".query.lean_version_all")}</span>
                  </>
                )
              },
              ...appState.serverPreference.misc.leanVersions.map(version => ({
                key: version,
                value: version,
                text: (
                  <>
                    <Icon name="chartline" />
                    {version}
                  </>
                )
              }))
            ]}
          />
          <Form.Select
            className={style.queryInputStatus + " " + style.select + (!queryStatus ? " " + style.selectedAll : "")}
            value={queryStatus || "ALL"}
            onChange={(e, { value }) => setQueryStatus(value === "ALL" ? null : (value as SubmissionStatus))}
            options={[
              {
                key: "",
                value: "ALL",
                text: (
                  <>
                    <Icon name="question" />
                    <span className={style.notInMenu}>{_(".query.status")}</span>
                    <span className={style.inMenu}>{_(".query.status_all")}</span>
                  </>
                )
              },
              ...Object.values(SubmissionStatus).map(status => ({
                key: status,
                value: status,
                text: <StatusText status={status} />
              }))
            ]}
          />
          <Button
            className={style.queryButton + (isWideScreen ? " labeled icon" : "")}
            icon="search"
            content={isWideScreen ? _(".query.filter") : null}
            onClick={() => onFilter(false)}
          />
          {appState.currentUser && (
            <Button
              className={(isWideScreen ? "labeled icon " : "") + style.mySubmissions}
              primary
              icon="user"
              content={isWideScreen ? _(".query.my_submissions") : null}
              onClick={() => onFilter(true)}
            />
          )}
        </Form.Group>
      </Form>
      {submissions.length === 0 ? (
        <Segment placeholder>
          <Header icon>
            {Object.values(props.query).some(x => x) ? (
              <>
                <Icon name="search" />
                {_(".empty.message_filtered")}
              </>
            ) : (
              <>
                <Icon name="file" />
                {_(".empty.message_not_filtered")}
              </>
            )}
          </Header>
          <Segment.Inline>
            <Button primary onClick={() => navigation.goBack()}>
              {_(".empty.goback")}
            </Button>
          </Segment.Inline>
        </Segment>
      ) : (
        <>
          <Table textAlign="center" basic="very" className={style.table} unstackable fixed>
            {isMobile ? (
              <Table.Header>
                <SubmissionHeaderMobile />
              </Table.Header>
            ) : (
              <Table.Header>
                <SubmissionHeader page="submissions" config={{ hideTimeMemory: true }} />
              </Table.Header>
            )}
            <Table.Body>
              {submissions.map(submission => {
                return isMobile ? (
                  <SubmissionItemMobile
                    key={submission.id}
                    submission={submission}
                  />
                ) : (
                  <SubmissionItem
                    key={submission.id}
                    submission={submission}
                    page="submissions"
                    config={{ hideTimeMemory: true }}
                  />
                );
              })}
            </Table.Body>
          </Table>
          {(hasPrevPage || hasNextPage) && (
            <div className={style.pagination}>
              <SimplePagination hasPrevPage={hasPrevPage} hasNextPage={hasNextPage} pageUrl={pageUrl} />
            </div>
          )}
        </>
      )}
    </>
  );
};

SubmissionsPage = observer(SubmissionsPage);

export default defineRoute(async request => {
  const query = normalizeQuery(request.query);
  const queryResult = await fetchData(query);

  return <SubmissionsPage key={uuid()} query={query} queryResult={queryResult} />;
});
