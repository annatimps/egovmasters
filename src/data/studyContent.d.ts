declare module "@/data/studyContent" {
  export interface StudyDocument {
    id: string;
    title: string;
    summary: string;
    content: string;
    file?: string;
  }
  export interface StudyTopic {
    id: string;
    title: string;
    documents: StudyDocument[];
  }
  export function materialUrl(filename: string): string;
  export const studyContent: StudyTopic[];
}
