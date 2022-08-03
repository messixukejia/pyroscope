import React, { useEffect } from 'react';
import 'react-dom';

import { Maybe } from '@webapp/util/fp';
import { useAppDispatch, useAppSelector } from '@webapp/redux/hooks';
import Box from '@webapp/ui/Box';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { FlamegraphRenderer } from '@pyroscope/flamegraph/src/FlamegraphRenderer';
import { Profile } from '@pyroscope/models/src';
import FileList from '@webapp/components/FileList';
import 'react-tabs/style/react-tabs.css';
import useExportToFlamegraphDotCom from '@webapp/components/exportToFlamegraphDotCom.hook';
import ExportData from '@webapp/components/ExportData';
import {
  fetchAllProfiles,
  fetchDiffProfile,
  fetchProfile,
  selectedSelectedProfileId,
  selectProfileId,
  selectShared,
  selectDiffProfile,
} from '@webapp/redux/reducers/adhoc';
import adhocStyles from './Adhoc.module.scss';
import adhocComparisonStyles from './AdhocComparison.module.scss';

function AdhocDiff() {
  const dispatch = useAppDispatch();
  const leftProfileId = useAppSelector(selectProfileId('left'));
  const rightProfileId = useAppSelector(selectProfileId('right'));

  const selectedProfileIdLeft = useAppSelector(
    selectedSelectedProfileId('left')
  );
  const selectedProfileIdRight = useAppSelector(
    selectedSelectedProfileId('right')
  );
  const { profilesList } = useAppSelector(selectShared);
  const diffProfile = useAppSelector(selectDiffProfile);
  const exportToFlamegraphDotComFn = useExportToFlamegraphDotCom(
    diffProfile.unwrapOr(undefined)
  );

  useEffect(() => {
    dispatch(fetchAllProfiles());
  }, [dispatch]);

  useEffect(() => {
    if (leftProfileId.isJust && rightProfileId.isJust) {
      dispatch(
        fetchDiffProfile({
          leftId: leftProfileId.value,
          rightId: rightProfileId.value,
        })
      );
    }
  }, [
    dispatch,
    leftProfileId.unwrapOr(undefined),
    rightProfileId.unwrapOr(undefined),
  ]);

  const flamegraph = (
    profile: Maybe<Profile>,
    exportToFn: ReturnType<typeof useExportToFlamegraphDotCom>
  ) => {
    if (profile.isNothing) {
      return <></>;
    }

    return (
      <FlamegraphRenderer
        profile={profile.value}
        showCredit={false}
        panesOrientation="vertical"
        ExportData={
          <ExportData
            flamebearer={profile.value}
            exportJSON
            exportFlamegraphDotCom
            exportFlamegraphDotComFn={exportToFn}
          />
        }
      />
    );
  };

  return (
    <div>
      <div className="main-wrapper">
        <div
          className="comparison-container"
          data-testid="comparison-container"
        >
          <Box className={adhocComparisonStyles.comparisonPane}>
            <Tabs>
              <TabList>
                <Tab>Pyroscope data</Tab>
                <Tab disabled>Upload</Tab>
              </TabList>
              <TabPanel>
                {profilesList.type === 'loaded' && (
                  <FileList
                    className={adhocStyles.tabPanel}
                    profilesList={profilesList.profilesList}
                    selectedProfileId={selectedProfileIdLeft}
                    onProfileSelected={(id: string) => {
                      dispatch(fetchProfile({ id, side: 'left' }));
                    }}
                  />
                )}
              </TabPanel>
              <TabPanel />
            </Tabs>
          </Box>
          <Box className={adhocComparisonStyles.comparisonPane}>
            <Tabs>
              <TabList>
                <Tab>Pyroscope data</Tab>
                <Tab disabled>Upload</Tab>
              </TabList>
              <TabPanel>
                {profilesList.type === 'loaded' && (
                  <FileList
                    className={adhocStyles.tabPanel}
                    profilesList={profilesList.profilesList}
                    selectedProfileId={selectedProfileIdRight}
                    onProfileSelected={(id: string) => {
                      dispatch(fetchProfile({ id, side: 'right' }));
                    }}
                  />
                )}
              </TabPanel>
              <TabPanel />
            </Tabs>
          </Box>
        </div>
        <Box>{flamegraph(diffProfile, exportToFlamegraphDotComFn)}</Box>
      </div>
    </div>
  );
}

export default AdhocDiff;
