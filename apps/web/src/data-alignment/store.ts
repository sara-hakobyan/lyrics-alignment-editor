import { createEditorStore } from "./createEditorStore";
import * as service from "./service";

export { getLines } from "./createEditorStore";
export const useEditorStore = createEditorStore(service);
