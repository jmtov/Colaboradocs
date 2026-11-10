import document from '@document';
import { PinGate, ReviewProvider } from '@juntanza/review-ui';
import type { DocumentContent } from '@/content/content.types';
import DocumentPage from '@/DocumentPage/DocumentPage';

const content = document as DocumentContent;

export default function App() {
  return (
    <ReviewProvider documentId={content.id} roleField={content.roleField}>
      <PinGate title={content.title}>
        <DocumentPage content={content} />
      </PinGate>
    </ReviewProvider>
  );
}
