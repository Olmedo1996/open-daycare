'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  NEW_POST_TYPE_LABEL,
  NEW_POST_TYPE_COLORS,
  getNewPostTargets,
  type NewPostType,
  type NewPostTarget,
} from '@/app/_data/newPost';
import { createPost, updatePost, type PostWithDetails } from '@/lib/actions/posts';
import { PhotoUpload, type ExistingPhoto } from '@/components/home/PhotoUpload';

const POST_TYPE_MAP: Record<NewPostType, PostWithDetails['type']> = {
  meal: 'meal',
  nap: 'nap',
  activity: 'activity',
  achievement: 'achievement',
  mood: 'photo',
  photo: 'photo',
  announcement: 'announcement',
};

const POST_TYPE_REVERSE: Record<string, NewPostType> = {
  meal: 'meal',
  nap: 'nap',
  activity: 'activity',
  achievement: 'achievement',
  photo: 'photo',
  announcement: 'announcement',
};

interface NewPostModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: () => void;
  post?: PostWithDetails;
}

export function NewPostModal({ open, onClose, onPublish, post }: NewPostModalProps) {
  const router = useRouter();
  const isEditing = !!post;
  const targets = getNewPostTargets();

  const [selectedTargets, setSelectedTargets] = useState<NewPostTarget[]>([]);
  const [selectedType, setSelectedType] = useState<NewPostType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [photos, setPhotos] = useState<File[]>([]);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const existingPhotos: ExistingPhoto[] = post?.photos ?? [];

  const resetForm = () => {
    setSelectedTargets([]);
    setSelectedType(null);
    setTitle('');
    setDescription('');
    setIsPublic(true);
    setPhotos([]);
    setDeletedPhotoIds([]);
    setError(null);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  useEffect(() => {
    if (open && post) {
      const newType = POST_TYPE_REVERSE[post.type] ?? 'activity';
      setSelectedType(newType);

      setTitle(post.title ?? '');
      setDescription(post.body);
      setIsPublic(post.is_public);

      const kidTargets = post.children.map((pc) => {
        const target = targets.find(
          (t) => t.type === 'kid' && t.id === pc.child.id,
        );
        return target ?? {
          type: 'kid' as const,
          id: pc.child.id,
          name: pc.child.full_name,
          initial: pc.child.full_name.charAt(0),
          avatarBg: '#A9D9E8',
          avatarColor: '#1F7A93',
        };
      });
      setSelectedTargets(kidTargets);
    }
  }, [open, post, targets]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSaving) {
      onClose();
    }
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSaving) {
        onClose();
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

  const toggleTarget = (target: NewPostTarget) => {
    setSelectedTargets((prev) => {
      if (target.type === 'all') {
        if (prev.some((t) => t.type === 'all')) {
          return prev.filter((t) => t.type !== 'all');
        }
        return [{ type: 'all', label: target.label }];
      }
      const isKidSelected = prev.some(
        (t) => t.type === 'kid' && t.id === target.id,
      );
      const filtered = prev.filter(
        (t) => t.type !== 'all' && !(t.type === 'kid' && t.id === target.id),
      );
      if (!isKidSelected) {
        return [...filtered, target];
      }
      return filtered;
    });
  };

  const handleRemoveExistingPhoto = (id: string) => {
    setDeletedPhotoIds((prev) => [...prev, id]);
  };

  const handleSave = async () => {
    if (!selectedType || !description.trim()) {
      setError('Completa el tipo y la descripción');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const childIds = selectedTargets
        .filter((t) => t.type === 'kid')
        .map((t) => t.id);

      const roomId = selectedTargets.some((t) => t.type === 'all')
        ? undefined
        : undefined;

      const base = {
        type: POST_TYPE_MAP[selectedType],
        title: title.trim() || undefined,
        body: description.trim(),
        room_id: roomId,
        is_public: isPublic,
        child_ids: childIds.length > 0 ? childIds : undefined,
      };

      if (isEditing && post) {
        const { error: err } = await updatePost({
          ...base,
          id: post.id,
          photos: photos.length > 0 ? photos : undefined,
          deleted_photo_ids: deletedPhotoIds.length > 0 ? deletedPhotoIds : undefined,
        });
        if (err) throw new Error(err);
      } else {
        const { error: err } = await createPost({
          ...base,
          photos: photos.length > 0 ? photos : undefined,
        });
        if (err) throw new Error(err);
      }

      router.refresh();
      onPublish();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-[580px] rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)]"
        style={{ overflow: 'hidden' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="text-[15px] font-bold text-[#94887B] hover:text-[#7A6E64] disabled:opacity-50"
          >
            Cancelar
          </button>
          <span className="font-head text-[18px] font-semibold text-[#3F362E]">
            {isEditing ? 'Editar publicación' : 'Nueva publicación'}
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="text-[15px] font-extrabold text-[#D9583C] hover:text-[#C44A2E] disabled:opacity-50"
          >
            {isSaving ? 'Guardando...' : isEditing ? 'Guardar' : 'Publicar'}
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto px-[26px] py-6">
          {/* TÍTULO */}
          <div className="mb-2.5 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
            TÍTULO (OPCIONAL)
          </div>
          <input
            type="text"
            placeholder="Ej. Anuncio general"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
            className="mb-[22px] w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3 text-[15px] text-[#3F362E] placeholder:text-[#B6A99B] disabled:opacity-50"
          />

          {/* TIPO */}
          <div className="mb-2.5 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
            TIPO
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {(Object.keys(NEW_POST_TYPE_LABEL) as NewPostType[]).map((type) => {
              const isSelected = selectedType === type;
              const colors = NEW_POST_TYPE_COLORS[type];
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  disabled={isSaving}
                  className="rounded-full px-4 py-2 text-[13.5px] font-extrabold transition-opacity disabled:opacity-50"
                  style={{
                    background: colors.bg,
                    color: colors.text,
                    opacity: isSelected ? 1 : 0.7,
                  }}
                >
                  {NEW_POST_TYPE_LABEL[type]}
                </button>
              );
            })}
          </div>

          {/* VISIBILIDAD */}
          <div className="mb-2.5 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
            VISIBILIDAD
          </div>
          <div className="mb-[22px] flex gap-[9px]">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              disabled={isSaving}
              className="rounded-full px-4 py-2 text-[13.5px] font-extrabold transition-colors disabled:opacity-50"
              style={{
                border: `1.5px solid ${isPublic ? '#3F362E' : '#ECE0D0'}`,
                background: isPublic ? '#3F362E' : '#FFFDF9',
                color: isPublic ? '#fff' : '#6E6359',
              }}
            >
              Público
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              disabled={isSaving}
              className="rounded-full px-4 py-2 text-[13.5px] font-extrabold transition-colors disabled:opacity-50"
              style={{
                border: `1.5px solid ${!isPublic ? '#3F362E' : '#ECE0D0'}`,
                background: !isPublic ? '#3F362E' : '#FFFDF9',
                color: !isPublic ? '#fff' : '#6E6359',
              }}
            >
              Privado
            </button>
          </div>

          {/* PARA */}
          <div className="mb-2.5 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
            PARA
          </div>
          <div className="mb-[22px] flex flex-wrap gap-[9px]">
            {targets.map((target) => {
              const isSelected = selectedTargets.some((t) => {
                if (t.type === 'all' && target.type === 'all') return true;
                if (t.type === 'kid' && target.type === 'kid')
                  return t.id === target.id;
                return false;
              });

              if (target.type === 'kid') {
                return (
                  <button
                    key={target.id}
                    type="button"
                    onClick={() => toggleTarget(target)}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[14px] font-bold transition-colors disabled:opacity-50"
                    style={
                      isSelected
                        ? {
                            border: '1.5px solid #3F362E',
                            background: '#3F362E',
                            color: '#fff',
                          }
                        : {
                            border: '1.5px solid #ECE0D0',
                            background: '#FFFDF9',
                            color: '#6E6359',
                          }
                    }
                  >
                    <span
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-full font-head text-[13px] font-semibold"
                      style={{
                        background: target.avatarBg,
                        color: target.avatarColor,
                      }}
                    >
                      {target.initial}
                    </span>
                    {target.name.split(' ')[0]}
                  </button>
                );
              }

              return (
                <button
                  key="all"
                  type="button"
                  onClick={() => toggleTarget(target)}
                  disabled={isSaving}
                  className="rounded-full px-4 py-1.5 text-[14px] font-bold transition-colors disabled:opacity-50"
                  style={
                    isSelected
                      ? {
                          border: '1.5px solid #3F362E',
                          background: '#3F362E',
                          color: '#fff',
                        }
                      : {
                          border: '1.5px solid #ECE0D0',
                          background: '#FFFDF9',
                          color: '#6E6359',
                        }
                  }
                >
                  {target.label}
                </button>
              );
            })}
          </div>

          {/* DESCRIPCIÓN */}
          <div className="mb-2.5 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
            DESCRIPCIÓN
          </div>
          <textarea
            placeholder="Contá cómo le fue hoy…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isSaving}
            className="mb-[22px] w-full resize-y rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-3.5 text-[15px] leading-relaxed text-[#3F362E] placeholder:text-[#B6A99B] disabled:opacity-50"
            style={{ minHeight: '120px' }}
          />

          {/* FOTOS */}
          <div className="mb-2.5 text-[12px] font-extrabold tracking-[.7px] text-[#94887B]">
            FOTOS
          </div>
          <PhotoUpload
            photos={photos}
            onPhotosChange={setPhotos}
            maxPhotos={10}
            existingPhotos={isEditing ? existingPhotos : []}
            onRemoveExisting={isEditing ? handleRemoveExistingPhoto : undefined}
            disabled={isSaving}
          />

          {/* Error */}
          {error && (
            <p className="mt-3 text-[13px] font-medium text-[#D9583C]">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
