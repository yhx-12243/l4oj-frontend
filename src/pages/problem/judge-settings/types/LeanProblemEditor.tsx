import React from "react";
import { observer } from "mobx-react";

import { JudgeInfoProcessor, EditorComponentProps, Options } from "../common/interface";

import MetaEditor from "../common/MetaEditor";

type LeanAxiom = {
  name: string,
  url: string,
}

export interface JudgeInfoLean {
  axioms: LeanAxiom[];
  checker: string;
}
type LeanProblemEditorProps = EditorComponentProps<JudgeInfoLean>;

export const
  DEFAULT_AXIOMS = [
    { name: 'propext', url: 'https://leanprover-community.github.io/mathlib4_docs/Init/Core.html#propext' },
    { name: 'Quot.sound', url: 'https://leanprover-community.github.io/mathlib4_docs/Init/Core.html#Quot.sound' },
    { name: 'Classical.choice', url: 'https://leanprover-community.github.io/mathlib4_docs/Init/Prelude.html#Classical.choice' }
  ] as LeanAxiom[],
  DEFAULT_CHECKER = 'todo';

const metaEditorOptions: Options<typeof MetaEditor> = {
  enableTimeMemoryLimit: false,
  enableFileIo: false,
  enableRunSamples: false
};

let LeanProblemEditor: React.FC<LeanProblemEditorProps> = props => {
  return null;
};

LeanProblemEditor = observer(LeanProblemEditor);

function parseAxiom(raw: any): LeanAxiom[] {
  if (typeof raw === 'string')
    return [{ name: raw, url: '' }];
  if (typeof raw?.name === 'string')
    return [{ name: raw.name, url: typeof raw.url === 'string' ? raw.url : '' }];
  return [];
}

const judgeInfoProcessor: JudgeInfoProcessor<JudgeInfoLean> = {
  parseJudgeInfo(raw) {
    const axioms = Array.isArray(raw?.axioms) ? raw.axioms.flatMap(parseAxiom) : DEFAULT_AXIOMS;
    const checker = typeof raw?.checker === 'string' ? raw.checker : DEFAULT_CHECKER;
    return { axioms, checker };
  },
  normalizeJudgeInfo() {}
};

export default Object.assign(LeanProblemEditor, judgeInfoProcessor);
