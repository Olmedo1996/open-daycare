import { AlertIcon } from "../shared/icons";

type AllergyNotesProps = {
  notes: string;
};

export function AllergyNotes({ notes }: AllergyNotesProps) {
  return (
    <div className="flex gap-[14px] rounded-[16px] bg-alert-bg px-[18px] py-4">
      <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-alert-icon">
        <AlertIcon className="h-[22px] w-[22px] text-white" strokeWidth={2.2} />
      </div>
      <div>
        <div className="mb-0.5 text-[15px] font-extrabold text-alert-title">
          Alergias y notas
        </div>
        <div className="text-[14.5px] leading-relaxed text-alert-text">
          {notes}
        </div>
      </div>
    </div>
  );
}