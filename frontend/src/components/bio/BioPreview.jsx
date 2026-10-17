import BioPageView from './BioPageView.jsx';

export default function BioPreview({ page, className }) {
  return (
    <div className={className}>
      <div className="mx-auto w-full max-w-[20rem] overflow-hidden rounded-[2.25rem] border border-base-700 bg-base-950 shadow-panel">
        <div className="flex items-center justify-center bg-base-900 py-2">
          <span className="h-1.5 w-12 rounded-none bg-base-700" />
        </div>
        <div className="max-h-[34rem] overflow-y-auto">
          <BioPageView page={page} showHidden className="min-h-[30rem]" />
        </div>
      </div>
    </div>
  );
}
