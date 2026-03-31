import { useState, useRef } from 'react';
import { IconCheck } from '@tabler/icons';
import Button from 'ui/Button';
import { isHttpUrl } from 'utils/url/index';
import { isOpenApiSpec } from 'utils/importers/openapi-collection';
import { parseFileAsJsonOrYaml } from 'utils/importers/file-reader';

const FEATURES = [
  '检测新增、修改和删除的 endpoint',
  '追踪相对于 Spec 的本地变更',
  '一键同步 Collection',
  '同步时保留你的测试、断言和脚本'
];

const ConnectSpecForm = ({ sourceUrl, setSourceUrl, isLoading, error, setError, onConnect }) => {
  const [mode, setMode] = useState('url');
  const fileInputRef = useRef(null);

  return (
    <div className="setup-section">
      <div className="setup-header">
        <h2 className="setup-title">连接到 OpenAPI Spec</h2>
        <p className="setup-description">
          保持你的 Collection 与 OpenAPI specification 同步。Spec 中的变更将被自动检测。
        </p>
      </div>

      <form
        className="setup-form"
        onSubmit={(e) => {
          e.preventDefault(); onConnect();
        }}
      >
        <label className="url-label">OpenAPI Specification</label>
        <div className="url-row">
          <div className="setup-mode-toggle">
            <button
              type="button"
              className={`setup-mode-btn ${mode === 'url' ? 'active' : ''}`}
              onClick={() => {
                setMode('url'); setSourceUrl('');
              }}
            >
              URL
            </button>
            <button
              type="button"
              className={`setup-mode-btn ${mode === 'file' ? 'active' : ''}`}
              onClick={() => {
                setMode('file'); setSourceUrl('');
              }}
            >
              File
            </button>
          </div>

          {mode === 'url' ? (
            <input
              type="text"
              className="url-input"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://api.example.com/openapi.json"
            />
          ) : (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.yaml,.yml"
                style={{ display: 'none' }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError(null);
                  setSourceUrl('');
                  try {
                    const data = await parseFileAsJsonOrYaml(file);
                    if (!isOpenApiSpec(data)) {
                      setError('所选文件不是有效的 OpenAPI 3.x specification');
                      return;
                    }
                    const filePath = window.ipcRenderer.getFilePath(file);
                    if (filePath) setSourceUrl(filePath);
                  } catch (err) {
                    setError(err.message || '读取所选文件失败');
                  }
                }}
              />
              <button
                type="button"
                className="url-input file-pick-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {sourceUrl ? sourceUrl.split(/[\\/]/).pop() : '选择文件...'}
              </button>
            </>
          )}

          <Button
            type="submit"
            size="sm"
            disabled={mode === 'url' ? !isHttpUrl(sourceUrl.trim()) : !sourceUrl.trim()}
            loading={isLoading}
          >
            连接
          </Button>
        </div>
        <p className="setup-hint">
          {mode === 'url'
            ? '支持 JSON 或 YAML 格式的 OpenAPI 3.x specification'
            : '选择本地 OpenAPI/Swagger JSON 或 YAML 文件'}
        </p>
        {error && (
          <p className="setup-error">{error}</p>
        )}
      </form>

      <div className="setup-features">
        {FEATURES.map((text) => (
          <div className="setup-feature" key={text}>
            <IconCheck size={16} />
            <span>{text}</span>
          </div>
        ))}
      </div>

      <p className="beta-feedback-inline">
        OpenAPI Sync 处于 Beta 阶段 — 我们希望听到你的反馈和建议。{' '}
        <button
          type="button"
          className="beta-feedback-link"
          onClick={() => window?.ipcRenderer?.openExternal('https://github.com/usebruno/bruno/discussions/7401')}
        >
          分享反馈
        </button>
      </p>
    </div>
  );
};

export default ConnectSpecForm;
