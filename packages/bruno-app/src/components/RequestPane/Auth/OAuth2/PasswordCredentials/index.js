import React from 'react';
import { useDetectSensitiveField } from 'hooks/useDetectSensitiveField';
import get from 'lodash/get';
import { useTheme } from 'providers/Theme';
import { useDispatch } from 'react-redux';
import { IconCaretDown, IconSettings, IconKey, IconAdjustmentsHorizontal, IconHelp } from '@tabler/icons';
import SingleLineEditor from 'components/SingleLineEditor';
import StyledWrapper from './StyledWrapper';
import { inputsConfig } from './inputsConfig';
import MenuDropdown from 'ui/MenuDropdown';
import Oauth2TokenViewer from '../Oauth2TokenViewer/index';
import Oauth2ActionButtons from '../Oauth2ActionButtons/index';
import AdditionalParams from '../AdditionalParams/index';
import SensitiveFieldWarning from 'components/SensitiveFieldWarning/index';

const OAuth2PasswordCredentials = ({ save, item = {}, request, handleRun, updateAuth, collection }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const oAuth = get(request, 'auth.oauth2', {});
  const { isSensitive } = useDetectSensitiveField(collection);

  const {
    accessTokenUrl,
    username,
    password,
    clientId,
    clientSecret,
    scope,
    credentialsPlacement,
    credentialsId,
    tokenPlacement,
    tokenHeaderPrefix,
    tokenQueryKey,
    refreshTokenUrl,
    autoRefreshToken,
    autoFetchToken,
    tokenSource,
    additionalParameters
  } = oAuth;

  const refreshTokenUrlAvailable = refreshTokenUrl?.trim() !== '';
  const isAutoRefreshDisabled = !refreshTokenUrlAvailable;

  const handleSave = () => { save(); };

  const handleChange = (key, value) => {
    dispatch(
      updateAuth({
        mode: 'oauth2',
        collectionUid: collection.uid,
        itemUid: item.uid,
        content: {
          grantType: 'password',
          accessTokenUrl,
          username,
          password,
          clientId,
          clientSecret,
          scope,
          credentialsPlacement,
          credentialsId,
          tokenPlacement,
          tokenHeaderPrefix,
          tokenQueryKey,
          refreshTokenUrl,
          autoRefreshToken,
          autoFetchToken,
          tokenSource,
          additionalParameters,
          [key]: value
        }
      })
    );
  };

  return (
    <StyledWrapper className="mt-2 flex w-full gap-4 flex-col">
      <Oauth2TokenViewer handleRun={handleRun} collection={collection} item={item} url={accessTokenUrl} credentialsId={credentialsId} />
      <div className="flex items-center gap-2.5 mt-2">
        <div className="flex items-center px-2.5 py-1.5 oauth2-icon-container rounded-md">
          <IconSettings size={14} className="oauth2-icon" />
        </div>
        <span className="oauth2-section-label">
          配置
        </span>
      </div>
      {inputsConfig.map((input) => {
        const { key, label, isSecret } = input;
        const value = oAuth[key] || '';
        const { showWarning, warningMessage } = isSensitive(value);

        return (
          <div className="flex items-center gap-4 w-full" key={`input-${key}`}>
            <label className="block min-w-[140px]">{label}</label>
            <div className="single-line-editor-wrapper flex-1 flex items-center">
              <SingleLineEditor
                value={value}
                theme={storedTheme}
                onSave={handleSave}
                onChange={(val) => handleChange(key, val)}
                onRun={handleRun}
                collection={collection}
                item={item}
                isSecret={isSecret}
                isCompact
              />
              {isSecret && showWarning && <SensitiveFieldWarning fieldName={key} warningMessage={warningMessage} />}
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4 w-full" key="input-credentials-placement">
        <label className="block min-w-[140px]">添加凭证到</label>
        <div className="inline-flex items-center cursor-pointer token-placement-selector">
          <MenuDropdown
            items={[
              { id: 'body', label: '请求体', onClick: () => handleChange('credentialsPlacement', 'body') },
              { id: 'basic_auth_header', label: 'Basic Auth Header', onClick: () => handleChange('credentialsPlacement', 'basic_auth_header') }
            ]}
            selectedItemId={credentialsPlacement}
            placement="bottom-end"
          >
            <div className="flex items-center justify-end token-placement-label select-none">
              {credentialsPlacement == 'body' ? '请求体' : 'Basic Auth Header'}
              <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
            </div>
          </MenuDropdown>
        </div>
      </div>
      <div className="flex items-center gap-2.5 mt-2">
        <div className="flex items-center px-2.5 py-1.5 oauth2-icon-container rounded-md">
          <IconKey size={14} className="oauth2-icon" />
        </div>
        <span className="oauth2-section-label">
          Token
        </span>
      </div>
      <div className="flex items-center gap-4 w-full" key="input-token-type">
        <label className="block min-w-[140px]">Token 来源</label>
        <div className="inline-flex items-center cursor-pointer token-placement-selector">
          <MenuDropdown
            items={[
              { id: 'access_token', label: 'Access Token', onClick: () => handleChange('tokenSource', 'access_token') },
              { id: 'id_token', label: 'ID Token', onClick: () => handleChange('tokenSource', 'id_token') }
            ]}
            selectedItemId={tokenSource}
            placement="bottom-end"
          >
            <div className="flex items-center justify-end token-placement-label select-none">
              {tokenSource === 'id_token' ? 'ID Token' : 'Access Token'}
              <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
            </div>
          </MenuDropdown>
        </div>
      </div>
      <div className="flex items-center gap-4 w-full" key="input-token-name">
        <label className="block min-w-[140px]">Token ID</label>
        <div className="single-line-editor-wrapper flex-1">
          <SingleLineEditor
            value={oAuth['credentialsId'] || ''}
            theme={storedTheme}
            onSave={handleSave}
            onChange={(val) => handleChange('credentialsId', val)}
            onRun={handleRun}
            collection={collection}
            item={item}
            isCompact
          />
        </div>
      </div>
      <div className="flex items-center gap-4 w-full" key="input-token-placement">
        <label className="block min-w-[140px]">添加 Token 到</label>
        <div className="inline-flex items-center cursor-pointer token-placement-selector">
          <MenuDropdown
            items={[
              { id: 'header', label: 'Header', onClick: () => handleChange('tokenPlacement', 'header') },
              { id: 'url', label: 'URL', onClick: () => handleChange('tokenPlacement', 'url') }
            ]}
            selectedItemId={tokenPlacement}
            placement="bottom-end"
          >
            <div className="flex items-center justify-end token-placement-label select-none">
              {tokenPlacement == 'url' ? 'URL' : 'Headers'}
              <IconCaretDown className="caret ml-1 mr-1" size={14} strokeWidth={2} />
            </div>
          </MenuDropdown>
        </div>
      </div>
      {
        tokenPlacement === 'header'
          ? (
              <div className="flex items-center gap-4 w-full" key="input-token-prefix">
                <label className="block min-w-[140px]">Header 前缀</label>
                <div className="single-line-editor-wrapper flex-1">
                  <SingleLineEditor
                    value={oAuth['tokenHeaderPrefix'] || ''}
                    theme={storedTheme}
                    onSave={handleSave}
                    onChange={(val) => handleChange('tokenHeaderPrefix', val)}
                    onRun={handleRun}
                    collection={collection}
                    isCompact
                  />
                </div>
              </div>
            )
          : (
              <div className="flex items-center gap-4 w-full" key="input-token-query-param-key">
                <label className="block min-w-[140px]">Query 参数键</label>
                <div className="single-line-editor-wrapper flex-1">
                  <SingleLineEditor
                    value={oAuth['tokenQueryKey'] || ''}
                    theme={storedTheme}
                    onSave={handleSave}
                    onChange={(val) => handleChange('tokenQueryKey', val)}
                    onRun={handleRun}
                    collection={collection}
                    isCompact
                  />
                </div>
              </div>
            )
      }
      <div className="flex items-center gap-2.5 mt-4 mb-2">
        <div className="flex items-center px-2.5 py-1.5 oauth2-icon-container rounded-md">
          <IconAdjustmentsHorizontal size={14} className="oauth2-icon" />
        </div>
        <span className="oauth2-section-label">
          高级设置
        </span>
      </div>

      <div className="flex items-center gap-4 w-full mb-4">
        <label className="block min-w-[140px]">刷新 Token URL</label>
        <div className="single-line-editor-wrapper flex-1">
          <SingleLineEditor
            value={get(request, 'auth.oauth2.refreshTokenUrl', '')}
            theme={storedTheme}
            onSave={handleSave}
            onChange={(val) => handleChange('refreshTokenUrl', val)}
            collection={collection}
            item={item}
            isCompact
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 mt-4">
        <div className="flex items-center px-2.5 py-1.5 oauth2-icon-container rounded-md">
          <IconSettings size={14} className="oauth2-icon" />
        </div>
        <span className="oauth2-section-label">设置</span>
      </div>

      {/* Automatically Fetch Token */}
      <div className="flex items-center gap-4 w-full">
        <input
          type="checkbox"
          checked={Boolean(autoFetchToken)}
          onChange={(e) => handleChange('autoFetchToken', e.target.checked)}
          className="cursor-pointer ml-1"
        />
        <label className="block min-w-[140px]">自动获取 Token（如未找到）</label>
        <div className="flex items-center gap-2">
          <div className="relative group cursor-pointer">
            <IconHelp size={16} className="text-gray-500" />
            <span className="group-hover:opacity-100 pointer-events-none opacity-0 max-w-60 absolute left-0 bottom-full mb-1 w-max p-2 bg-gray-700 text-white text-xs rounded-md transition-opacity duration-200">
              当你尝试访问资源但没有 Token 时自动获取新的 Token。
            </span>
          </div>
        </div>
      </div>

      {/* Auto Refresh Token (With Refresh URL) */}
      <div className="flex items-center gap-4 w-full">
        <input
          type="checkbox"
          checked={Boolean(autoRefreshToken)}
          onChange={(e) => handleChange('autoRefreshToken', e.target.checked)}
          className={`cursor-pointer ml-1 ${isAutoRefreshDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isAutoRefreshDisabled}
        />
        <label className={`block min-w-[140px] ${isAutoRefreshDisabled ? 'text-gray-500' : ''}`}>自动刷新 Token（使用刷新 URL）</label>
        <div className="flex items-center gap-2">
          <div className="relative group cursor-pointer">
            <IconHelp size={16} className="text-gray-500" />
            <span className="group-hover:opacity-100 pointer-events-none opacity-0 max-w-60 absolute left-0 bottom-full mb-1 w-max p-2 bg-gray-700 text-white text-xs rounded-md transition-opacity duration-200">
              当 Token 过期时使用刷新 URL 自动刷新。
            </span>
          </div>
        </div>
      </div>
      <AdditionalParams
        item={item}
        request={request}
        collection={collection}
        updateAuth={updateAuth}
        handleSave={handleSave}
      />
      <Oauth2ActionButtons item={item} request={request} collection={collection} url={accessTokenUrl} credentialsId={credentialsId} />
    </StyledWrapper>
  );
};

export default OAuth2PasswordCredentials;
