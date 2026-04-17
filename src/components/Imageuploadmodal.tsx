// ─── ImageUploadModal.tsx ─────────────────────────────────────────────────────
// Matches the screenshot exactly:
//  • Light grey card border (not red)
//  • Blue filename text
//  • Neutral grey trash icon
//  • Solid blue progress bar rendered INSIDE the card at the bottom
//  • Max size hint shows 1 MB in dragger text
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef } from 'react';
import { Modal, Upload, Button } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { FiUploadCloud, FiImage } from 'react-icons/fi';
import { IoTrashBinSharp } from 'react-icons/io5';
import styled from '@emotion/styled';

// ─── Styled ───────────────────────────────────────────────────────────────────

const DraggerWrap = styled.div`
  .ant-upload-drag {
    border: 2px dashed #d9d9d9 !important;
    border-radius: 12px !important;
    background: #fafafa !important;
    padding: 8px 0;
    transition: border-color 0.2s ease, background 0.2s ease;
  }
  .ant-upload-drag:hover,
  .ant-upload-drag.ant-upload-drag-hover {
    border-color: #1677ff !important;
    background: #f0f7ff !important;
  }
  .ant-upload-drag-icon { margin-bottom: 10px; }
  .ant-upload-text {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #1f2937 !important;
  }
  .ant-upload-hint {
    font-size: 12px !important;
    color: #6b7280 !important;
    margin-top: 4px !important;
  }
`;

// File card — matches screenshot: light grey border, no red anywhere
const FileCard = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1.5px solid #e0e6ef;
  border-radius: 8px;
  padding: 10px 12px 0 12px;
  margin-top: 14px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  flex-direction: column;
  overflow: hidden;
`;

const FileCardRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding-bottom: 10px;
`;

const Thumb = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
  flex-shrink: 0;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 5px;
  }
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const FileName = styled.span`
  font-size: 13px;
  font-weight: 500;
  color: #1677ff;           /* blue — matches screenshot */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const FileSize = styled.span`
  font-size: 11px;
  color: #9ca3af;
`;

const DeleteBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #9ca3af;           /* neutral grey — matches screenshot */
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: #ff4d4f;
    background: #fff1f0;
  }
`;

// Blue progress bar that sits flush at the bottom of the card
const ProgressBar = styled.div<{ percent: number }>`
  width: 100%;
  height: 3px;
  background: #f0f0f0;
  border-radius: 0 0 6px 6px;
  overflow: hidden;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: ${({ percent }) => percent}%;
    background: #1677ff;
    border-radius: 0 0 6px 6px;
    transition: width 0.4s ease;
  }
`;

const ModalTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
`;

const FooterRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ImageUploadModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * Called when user clicks "Confirm".
   * file    — raw File object (null = user cleared the selection)
   * preview — UploadFile with thumbUrl used for the inline form-level file card
   */
  onConfirm: (file: File | null, preview: UploadFile | null) => void;
  /** Already-committed file shown pre-selected when the modal re-opens */
  existingFile?: UploadFile | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_SIZE_MB = 5;

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageUploadModal({
  open,
  onClose,
  onConfirm,
  existingFile = null,
}: ImageUploadModalProps) {
  const [draftFile, setDraftFile] = useState<UploadFile | null>(existingFile);
  const [sizeError, setSizeError] = useState('');
  const pendingRawRef             = useRef<File | null>(null);

  // Sync draft each time the modal becomes visible
  const handleAfterOpen = (visible: boolean) => {
    if (visible) {
      setDraftFile(existingFile ?? null);
      setSizeError('');
      if (!existingFile) pendingRawRef.current = null;
    }
  };

  const draggerProps: UploadProps = {
    name: 'file',
    multiple: false,
    maxCount: 1,
    accept: 'image/*',
    showUploadList: false,
    beforeUpload(file) {
      setSizeError('');

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setSizeError(`File too large — maximum is ${MAX_SIZE_MB} MB.`);
        return false;
      }

      const objectUrl = URL.createObjectURL(file);
      pendingRawRef.current = file;
      setDraftFile({
        uid         : String(Date.now()),
        name        : file.name,
        status      : 'done',
        url         : objectUrl,
        thumbUrl    : file.type.startsWith('image/') ? objectUrl : undefined,
        size        : file.size,
        type        : file.type,
        originFileObj: file,
      });
      return false; // prevent Ant Design auto-upload
    },
  };

  const handleRemove = () => {
    setDraftFile(null);
    pendingRawRef.current = null;
    setSizeError('');
  };

  const handleConfirm = () => {
    onConfirm(pendingRawRef.current, draftFile);
    onClose();
  };

  const handleCancel = () => {
    setDraftFile(existingFile ?? null);
    pendingRawRef.current = null;
    setSizeError('');
    onClose();
  };

  // Progress = file size as a % of MAX_SIZE_MB — purely a visual size indicator
  const fileSizePct = draftFile?.size
    ? Math.min(100, Math.round((draftFile.size / (MAX_SIZE_MB * 1024 * 1024)) * 100))
    : 0;

  return (
    <Modal
      title={
        <ModalTitle>
          <FiImage size={17} />
          Upload Item Image
        </ModalTitle>
      }
      open={open}
      onCancel={handleCancel}
      afterOpenChange={handleAfterOpen}
      width={480}
      centered
      destroyOnClose={false}
      footer={
        <FooterRow>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            type="primary"
            onClick={handleConfirm}
            disabled={!draftFile}
            icon={<FiUploadCloud size={14} style={{ marginTop: 1 }} />}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            Confirm
          </Button>
        </FooterRow>
      }
    >
      {/* ── Dragger ───────────────────────────────────────────────────── */}
      <DraggerWrap>
        <Upload.Dragger {...draggerProps}>
          <p className="ant-upload-drag-icon">
            <FiUploadCloud size={44} color="#1677ff" />
          </p>
          <p className="ant-upload-text">Click or drag an image here</p>
          <p className="ant-upload-hint">
            JPG · PNG · WEBP · GIF &nbsp;·&nbsp; Max {MAX_SIZE_MB} MB
          </p>
        </Upload.Dragger>
      </DraggerWrap>

      {/* ── Size validation error ─────────────────────────────────────── */}
      {sizeError && (
        <p style={{ marginTop: 10, marginBottom: 0, color: '#ff4d4f', fontSize: 13 }}>
          {sizeError}
        </p>
      )}

      {/* ── Selected file card ────────────────────────────────────────── */}
      {draftFile && (
        <FileCard role="listitem" aria-label={`Selected: ${draftFile.name}`}>

          {/* Top row: thumbnail · name + size · delete */}
          <FileCardRow>
            <Thumb>
              {draftFile.thumbUrl
                ? <img src={draftFile.thumbUrl} alt="" />
                : <FiImage size={16} color="#9ca3af" />
              }
            </Thumb>

            <FileInfo>
              <FileName title={draftFile.name}>{draftFile.name}</FileName>
              {draftFile.size !== undefined && (
                <FileSize>{formatBytes(draftFile.size)}</FileSize>
              )}
            </FileInfo>

            <DeleteBtn
              aria-label={`Remove ${draftFile.name}`}
              onClick={handleRemove}
              onKeyDown={(e) => e.key === 'Enter' && handleRemove()}
              tabIndex={0}
            >
              <IoTrashBinSharp size={17} />
            </DeleteBtn>
          </FileCardRow>

          {/* Blue progress bar flush at the bottom of the card */}
          {draftFile.size !== undefined && (
            <ProgressBar percent={fileSizePct} />
          )}

        </FileCard>
      )}
    </Modal>
  );
}