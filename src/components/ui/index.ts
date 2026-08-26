// Le primitive vivono in @studiofuturo/studio-core: qui restano solo i
// re-export, cosi' i file che le usano non cambiano import.
export {
  Button,
  Card,
  Input,
  Textarea,
  Select,
  Pill,
  IconButton,
  Sidebar,
  PageHeader,
  Badge,
  Skeleton,
  SkeletonChart,
  AgentCard,
  usePointer,
} from "@studiofuturo/studio-core";
export type {
  ButtonProps,
  CardProps,
  InputProps,
  TextareaProps,
  SelectProps,
  PillProps,
  IconButtonProps,
  SidebarProps,
  SidebarItemProps,
} from "@studiofuturo/studio-core";

// Restano locali: non sono ancora nel core.
export { ChatBubble, type ChatBubbleProps } from "./ChatBubble";
export { ActionCard, type ActionCardProps } from "./ActionCard";
export { FloatingModal, type FloatingModalProps } from "./FloatingModal";
export { SourceCard, type SourceCardProps, type SourceType } from "./SourceCard";
