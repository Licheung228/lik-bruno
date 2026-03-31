import React from 'react';
import get from 'lodash/get';
import VarsTable from './VarsTable';
import StyledWrapper from './StyledWrapper';

const Vars = ({ item, collection }) => {
  const requestVars = item.draft ? get(item, 'draft.request.vars.req') : get(item, 'request.vars.req');
  const responseVars = item.draft ? get(item, 'draft.request.vars.res') : get(item, 'request.vars.res');

  return (
    <StyledWrapper className="w-full flex flex-col">
      <div>
        <div className="mb-3 title text-xs">请求前变量</div>
        <VarsTable item={item} collection={collection} vars={requestVars} varType="request" />
      </div>
      <div>
        <div className="mt-3 mb-3 title text-xs">响应后变量</div>
        <VarsTable item={item} collection={collection} vars={responseVars} varType="response" />
      </div>
    </StyledWrapper>
  );
};

export default Vars;
