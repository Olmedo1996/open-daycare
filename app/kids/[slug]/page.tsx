import Link from "next/link";
import { notFound } from "next/navigation";
import { AllergyNotes } from "@/app/components/kids/AllergyNotes";
import { KidInfoCard } from "@/app/components/kids/KidInfoCard";
import { ParentList } from "@/app/components/kids/ParentList";
import { AppShell } from "@/app/components/shared/AppShell";
import { Avatar } from "@/app/components/shared/Avatar";
import { ChevronRightIcon, SunIcon } from "@/app/components/shared/icons";
import { kids } from "@/app/data/kids";

type KidProfilePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return kids.map((kid) => ({ slug: kid.slug }));
}

export default async function KidProfilePage({
  params,
}: KidProfilePageProps) {
  const { slug } = await params;
  const kid = kids.find((item) => item.slug === slug);

  if (!kid) {
    notFound();
  }

  return (
    <AppShell activePath="/kids" maxWidth={820}>
      <Link
        href="/kids"
        className="mb-5 flex items-center gap-[7px] text-sm font-bold text-muted"
      >
        <ChevronRightIcon className="h-[18px] w-[18px] rotate-180" />
        Volver a Niños
      </Link>

      <div className="flex flex-wrap items-start gap-[26px]">
        <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
          <div className="flex items-center gap-[18px]">
            <Avatar
              name={kid.name}
              tone={kid.avatarTone}
              className="h-[84px] w-[84px] flex-none text-[34px]"
            />
            <div className="flex-1">
              <h1 className="font-display text-[28px] font-semibold text-ink">
                {kid.name}
              </h1>
              <p className="mt-[3px] text-[15px] text-muted">
                {kid.ageLabel} · Sala {kid.room}
              </p>
            </div>
            <a
              href="#"
              className="rounded-xl border-[1.5px] border-line bg-surface px-4 py-[9px] text-sm font-bold text-muted-deep"
            >
              Editar
            </a>
          </div>

          {kid.notes && <AllergyNotes notes={kid.notes} />}

          <KidInfoCard kid={kid} />
        </div>

        <div className="flex w-[300px] flex-none flex-col gap-[14px]">
          <a
            href="#"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink px-3 py-[13px] text-[15px] font-extrabold text-white"
          >
            <SunIcon className="h-[18px] w-[18px] text-white" />
            Resumen del día
          </a>
          <ParentList parents={kid.parents} />
        </div>
      </div>
    </AppShell>
  );
}