import { AiAssistNode, DecisionNode, InputNode, OutputNode, ReviewNode, TransformNode } from './CustomNodes';

export const nodeTypes = {
  input: InputNode,
  transform: TransformNode,
  decision: DecisionNode,
  review: ReviewNode,
  aiAssist: AiAssistNode,
  output: OutputNode,
};
