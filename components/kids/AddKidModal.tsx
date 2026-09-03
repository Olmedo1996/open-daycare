'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import type { Database } from '@/types/database.types';
import { useRouter } from 'next/navigation';
import { createChild, updateChild } from '@/app/kids/actions';

type Room = Database['public']['Tables']['rooms']['Row'];
type Child = Database['public']['Tables']['children']['Row'];

interface AddKidModalProps {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  child?: Child;
}

function getChildDefaults(child: Child) {
  const parts = child.birth_date.split('-');
  return {
    fullName: child.full_name,
    birthDate: `${parts[2]}/${parts[1]}/${parts[0]}`,
    roomId: child.room_id ?? '',
    allergies: child.allergy_tags.join(', '),
    medicalNotes: child.medical_notes,
  };
}

const emptyDefaults = {
  fullName: '',
  birthDate: '',
  roomId: '',
  allergies: '',
  medicalNotes: '',
};

export function AddKidModal({ open, onClose, rooms, child }: AddKidModalProps) {
  const router = useRouter();
  const isEditing = !!child;
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  const defaults = open && child ? getChildDefaults(child) : emptyDefaults;

  const [fullName, setFullName] = useState(defaults.fullName);
  const [birthDate, setBirthDate] = useState(defaults.birthDate);
  const [roomId, setRoomId] = useState(defaults.roomId);
  const [allergies, setAllergies] = useState(defaults.allergies);
  const [medicalNotes, setMedicalNotes] = useState(defaults.medicalNotes);
  const [isSaving, setIsSaving] = useState(false);

  const [nameError, setNameError] = useState('');
  const [dateError, setDateError] = useState('');
  const [roomError, setRoomError] = useState('');

  const sessionKey = open ? (child?.id ?? 'new') : null;
  const [prevSessionKey, setPrevSessionKey] = useState(sessionKey);

  if (sessionKey !== prevSessionKey) {
    setPrevSessionKey(sessionKey);
    if (open) {
      setFullName(defaults.fullName);
      setBirthDate(defaults.birthDate);
      setRoomId(defaults.roomId);
      setAllergies(defaults.allergies);
      setMedicalNotes(defaults.medicalNotes);
      setNameError('');
      setDateError('');
      setRoomError('');
    }
  }

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    dialogRef.current
      ?.querySelector<HTMLElement>('input, select, textarea')
      ?.focus();

    return () => {
      restoreFocusRef.current?.focus();
    };
  }, [open]);

  const handleDateChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i === 2 || i === 4) formatted += '/';
      formatted += digits[i];
    }
    setBirthDate(formatted);
  };

  const handleSave = async () => {
    let valid = true;
    setNameError('');
    setDateError('');
    setRoomError('');

    if (!fullName.trim()) {
      setNameError('El nombre es obligatorio');
      valid = false;
    }

    if (birthDate.length < 10) {
      setDateError('La fecha debe estar completa (dd/mm/aaaa)');
      valid = false;
    }

    if (!roomId) {
      setRoomError('Debes seleccionar una sala');
      valid = false;
    }

    if (!valid) return;

    const [dd, mm, yyyy] = birthDate.split('/');
    const isoDate = `${yyyy}-${mm}-${dd}`;

    const allergyArray = allergies
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter((a) => a.length > 0);

    setIsSaving(true);
    try {
      const payload = {
        full_name: fullName.trim(),
        birth_date: isoDate,
        room_id: roomId,
        allergy_tags: allergyArray,
        medical_notes: medicalNotes.trim(),
      };

      if (isEditing) {
        await updateChild(child.id, payload);
      } else {
        await createChild(payload);
      }

      router.refresh();
      onClose();
    } catch {
      setNameError('Error al guardar. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !dialog.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !dialog.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose, isSaving],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [open, handleKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[520px] rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
        style={{ overflow: 'hidden' }}
      >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-6 py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-[15px] font-bold text-[#94887B] hover:text-[#7A6E64] disabled:opacity-50"
          >
            Cancelar
          </button>
          <span
            id={titleId}
            className="font-fredoka text-[18px] font-semibold text-[#3F362E]"
          >
            {isEditing ? 'Editar niño' : 'Agregar niño'}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="text-[15px] font-extrabold text-[#D9583C] hover:text-[#C44A2E] disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        <div className="px-6 py-6">
          <label className="mb-2 block text-[12px] font-extrabold tracking-wide text-[#94887B]">
            NOMBRE COMPLETO
          </label>
          <input
            type="text"
            placeholder="Ej. Martina López"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSaving}
            className="mb-1 w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3 text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] disabled:opacity-50"
          />
          {nameError && (
            <p className="mb-4 text-[13px] font-medium text-[#D9583C]">
              {nameError}
            </p>
          )}

          <div className="mb-1 flex gap-[14px]">
            <div className="flex-1">
              <label className="mb-2 block text-[12px] font-extrabold tracking-wide text-[#94887B]">
                FECHA DE NACIMIENTO
              </label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={birthDate}
                onChange={(e) => handleDateChange(e.target.value)}
                maxLength={10}
                disabled={isSaving}
                className="w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3 text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] disabled:opacity-50"
              />
              {dateError && (
                <p className="mt-1 text-[13px] font-medium text-[#D9583C]">
                  {dateError}
                </p>
              )}
            </div>

            <div className="flex-1">
              <label className="mb-2 block text-[12px] font-extrabold tracking-wide text-[#94887B]">
                SALA
              </label>
              <div className="relative">
                <select
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setRoomError('');
                  }}
                  disabled={isSaving}
                  className="w-full appearance-none rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3 pr-10 text-[15px] font-bold text-[#3F362E] disabled:opacity-50"
                >
                  <option value="" disabled>
                    Seleccionar sala
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#B0A290"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>
              {roomError && (
                <p className="mt-1 text-[13px] font-medium text-[#D9583C]">
                  {roomError}
                </p>
              )}
            </div>
          </div>

          <label className="mb-2 mt-4 block text-[12px] font-extrabold tracking-wide text-[#94887B]">
            ALERGIAS (ETIQUETAS)
          </label>
          <input
            type="text"
            placeholder="Ej. Maní, Lactosa"
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            disabled={isSaving}
            className="mb-1 w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3 text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] disabled:opacity-50"
          />

          <label className="mb-2 mt-4 block text-[12px] font-extrabold tracking-wide text-[#94887B]">
            NOTAS MÉDICAS
          </label>
          <textarea
            placeholder="Indicaciones, medicación, contactos…"
            value={medicalNotes}
            onChange={(e) => setMedicalNotes(e.target.value)}
            disabled={isSaving}
            className="w-full resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#3F362E] placeholder:text-[#B6A99B] disabled:opacity-50"
            style={{ minHeight: '90px' }}
          />
        </div>
      </div>
    </div>
  );
}
