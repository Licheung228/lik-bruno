import styled from 'styled-components';

const StyledWrapper = styled.div`
  .git-action-modal-content {
    .git-info-card {
      border: 1px solid ${(props) => props.theme.borderColor};
      border-radius: 8px;
      padding: 12px;
      background: ${(props) => props.theme.bg};
    }

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .label {
      color: ${(props) => props.theme.text.muted};
      font-size: 12px;
      font-weight: 500;
    }

    .value {
      color: ${(props) => props.theme.text.default};
      font-size: 12px;
      font-weight: 600;
      text-align: right;
    }

    .value-url {
      max-width: 260px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .result-message {
      margin-top: 12px;
      border-radius: 6px;
      padding: 8px 10px;
      font-size: 12px;
      border: 1px solid;
    }

    .result-message.success {
      color: ${(props) => props.theme.status.success.text};
      background: ${(props) => props.theme.status.success.background};
      border-color: ${(props) => props.theme.status.success.border};
    }

    .result-message.error {
      color: ${(props) => props.theme.status.danger.text};
      background: ${(props) => props.theme.status.danger.background};
      border-color: ${(props) => props.theme.status.danger.border};
    }

    .git-actions {
      margin-top: 16px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
  }
`;

export default StyledWrapper;
