declare module "@/data/studyContent" {
  export interface StudyDocument {
    id: string;
    title: string;
    summary: string;
    content: string;
  }
  export interface StudyTopic {
    id: string;
    title: string;
    documents: StudyDocument[];
  }
  export const studyContent: StudyTopic[];
}
