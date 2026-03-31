import React from 'react';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';
import { clearRequestTimeline } from 'providers/ReduxStore/slices/collections/index';

const ClearTimeline = ({ collection, item }) => {
  const dispatch = useDispatch();

  const clearResponse = () =>
    dispatch(
      clearRequestTimeline({
        itemUid: item.uid,
        collectionUid: collection.uid
      })
    );

  return (
    <StyledWrapper className="flex items-center">
      <button type="button" onClick={clearResponse} className="text-link hover:underline whitespace-nowrap" title="清除时间线">
        清除时间线
      </button>
    </StyledWrapper>
  );
};

export default ClearTimeline;
