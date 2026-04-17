'use client';

import { AppShell } from './ui';
import {
  AdminOverviewScreen,
  AdminReportOpenScreen,
  AdminReportsScreen,
  AdminSchedulesScreen,
  AdminSitesScreen,
} from './screens/admin';
import {
  BadWorkplaceScreen,
  HomeScreen,
  PhotoAlbumScreen,
  QuarterlyScreen,
  SessionScreen,
  SiteReportsScreen,
  WorkerCalendarScreen,
} from './screens/worker';

type SearchParams = Record<string, string | string[] | undefined>;

function pick(searchParams: SearchParams, key: string) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export function RouteApp({
  segments,
  searchParams,
}: {
  segments: string[];
  searchParams: SearchParams;
}) {
  const pathname = segments.length === 0 ? '/' : `/${segments.join('/')}`;
  let content = <HomeScreen />;

  if (segments[0] === 'admin' && segments.length === 1) {
    content = <AdminOverviewScreen />;
  } else if (segments[0] === 'admin' && segments[1] === 'schedules') {
    content = <AdminSchedulesScreen />;
  } else if (segments[0] === 'admin' && segments[1] === 'sites') {
    content = <AdminSitesScreen />;
  } else if (segments[0] === 'admin' && segments[1] === 'reports') {
    content = <AdminReportsScreen />;
  } else if (segments[0] === 'admin' && segments[1] === 'report-open') {
    content = <AdminReportOpenScreen reportKey={pick(searchParams, 'reportKey')} />;
  } else if (segments[0] === 'calendar') {
    content = <WorkerCalendarScreen initialSiteId={pick(searchParams, 'siteId')} />;
  } else if (segments[0] === 'sites' && segments.length === 2) {
    content = <SiteReportsScreen siteId={segments[1]} mobile={false} />;
  } else if (segments[0] === 'sites' && segments[2] === 'photos') {
    content = <PhotoAlbumScreen siteId={segments[1]} mobile={false} />;
  } else if (segments[0] === 'sites' && segments[2] === 'quarterly' && segments[3]) {
    content = <QuarterlyScreen siteId={segments[1]} quarterKey={segments[3]} mobile={false} />;
  } else if (segments[0] === 'sites' && segments[2] === 'bad-workplace' && segments[3]) {
    content = <BadWorkplaceScreen siteId={segments[1]} reportMonth={segments[3]} mobile={false} />;
  } else if (segments[0] === 'sessions' && segments[1]) {
    content = (
      <SessionScreen
        sessionId={decodeURIComponent(segments[1])}
        mobile={false}
        directSignature={pick(searchParams, 'action') === 'direct-signature'}
      />
    );
  } else if (segments[0] === 'mobile' && segments[1] === 'sites' && segments.length === 3) {
    content = <SiteReportsScreen siteId={segments[2]} mobile />;
  } else if (segments[0] === 'mobile' && segments[1] === 'sites' && segments[3] === 'photos') {
    content = <PhotoAlbumScreen siteId={segments[2]} mobile />;
  } else if (segments[0] === 'mobile' && segments[1] === 'sites' && segments[3] === 'quarterly' && segments[4]) {
    content = <QuarterlyScreen siteId={segments[2]} quarterKey={segments[4]} mobile />;
  } else if (
    segments[0] === 'mobile' &&
    segments[1] === 'sites' &&
    segments[3] === 'bad-workplace' &&
    segments[4]
  ) {
    content = <BadWorkplaceScreen siteId={segments[2]} reportMonth={segments[4]} mobile />;
  } else if (segments[0] === 'mobile' && segments[1] === 'sessions' && segments[2]) {
    content = (
      <SessionScreen
        sessionId={decodeURIComponent(segments[2])}
        mobile
        directSignature={pick(searchParams, 'action') === 'direct-signature'}
      />
    );
  }

  return <AppShell pathname={pathname}>{content}</AppShell>;
}

