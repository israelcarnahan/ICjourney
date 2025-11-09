import React from "react";
import FilePreview from "../FilePreview";
import type { FileMetadata } from "../../context/PubDataContext";

interface UploadedFilesPanelProps {
  files: FileMetadata[];
  onEdit: (fileId: string) => void;
  onDelete?: (fileId: string) => void;
  maxFiles?: number;
}

const UploadedFilesPanel: React.FC<UploadedFilesPanelProps> = ({
  files,
  onEdit,
  onDelete,
  maxFiles = 6,
}) => {
  return (
    <div className="mt-6">
      <FilePreview
        files={files}
        onEdit={onEdit}
        onDelete={onDelete}
        maxFiles={maxFiles}
      />
    </div>
  );
};

export default UploadedFilesPanel;

