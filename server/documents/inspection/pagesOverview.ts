import 'server-only';

import {
  DEFAULT_GUIDANCE_AGENCY,
  WORK_PLAN_ITEMS,
} from '@/constants/inspectionSession';
import type { InspectionSession } from '@/types/inspectionSession';
import {
  ReportPageDraft,
  check,
  formatDate,
  imageTag,
  infoRows,
  lineBreaks,
  sectionTitle,
  valueText,
} from './format';

function buildCover(session: InspectionSession): ReportPageDraft {
  const snapshot = session.adminSiteSnapshot;

  return {
    cover: true,
    body: `
      <div class="cover-wrap">
        <div class="cover-title">건설재해예방 기술지도결과보고서</div>
        <div class="cover-site">현장명 : ${valueText(session.meta.siteName || snapshot.siteName)}</div>
        <div class="cover-date">${formatDate(session.meta.reportDate)}</div>
        <table class="sign-table">
          <tr><th>담 당</th><th>검 토</th><th>승 인</th></tr>
          <tr><td>${valueText(session.meta.drafter)}</td><td>${valueText(session.meta.reviewer)}</td><td>${valueText(session.meta.approver)}</td></tr>
        </table>
        <div class="cover-company">
          <strong>${valueText(snapshot.companyName || DEFAULT_GUIDANCE_AGENCY)}</strong><br />
          ${valueText(snapshot.headquartersAddress)}<br />
          ${valueText(snapshot.headquartersContact)} ${snapshot.companyName ? '' : 'www.safetysite.co.kr'}
        </div>
      </div>
    `,
  };
}

function buildDoc1Doc2(session: InspectionSession): ReportPageDraft {
  const overview = session.document2Overview;
  const snapshot = session.adminSiteSnapshot;
  const workPlanRows = WORK_PLAN_ITEMS.map(
    (item) =>
      `<tr><th>${item.label}</th><td>${valueText(
        overview.workPlanChecks[item.key] === 'written'
          ? '작성'
          : overview.workPlanChecks[item.key] === 'not_written'
            ? '미작성'
            : '해당없음'
      )}</td></tr>`
  ).join('');

  return {
    body: `
      ${sectionTitle('1. 기술지도 대상사업장')}
      <table class="info-table">${infoRows([
        { label: '현장명', value: snapshot.siteName },
        { label: '사업장관리번호(사업개시번호)', value: `${snapshot.siteManagementNumber} / ${snapshot.businessStartNumber}` },
        { label: '공사기간', value: snapshot.constructionPeriod },
        { label: '공사금액', value: snapshot.constructionAmount },
        { label: '책임자', value: snapshot.siteManagerName },
        { label: '연락처(이메일)', value: snapshot.siteContactEmail },
        { label: '현장주소', value: snapshot.siteAddress },
        { label: '회사명', value: snapshot.companyName },
        { label: '법인등록번호(사업자등록번호)', value: `${snapshot.corporationRegistrationNumber} / ${snapshot.businessRegistrationNumber}` },
        { label: '면허번호', value: snapshot.licenseNumber },
        { label: '본사 연락처', value: snapshot.headquartersContact },
        { label: '본사주소', value: snapshot.headquartersAddress },
      ])}</table>
      ${sectionTitle('2. 기술지도 개요')}
      <table class="info-table">${infoRows([
        { label: '지도기관명', value: overview.guidanceAgencyName || DEFAULT_GUIDANCE_AGENCY },
        { label: '기술지도실시일', value: formatDate(overview.guidanceDate) },
        { label: '구분', value: overview.constructionType },
        { label: '공정율', value: overview.progressRate },
        { label: '횟수', value: `${overview.visitCount} / 총 ${overview.totalVisitCount}` },
        { label: '이전기술지도 이행여부', value: overview.previousImplementationStatus },
        { label: '현장책임자 등', value: overview.notificationRecipientName },
        { label: '담당요원', value: overview.assignee },
        { label: '연락처', value: overview.contact },
        { label: '통보 방법', value: `${check(overview.notificationMethod === 'direct')} 직접전달 ${check(overview.notificationMethod === 'registered_mail')} 등기우편 ${check(overview.notificationMethod === 'email')} 전자우편 ${check(overview.notificationMethod === 'mobile')} 모바일 ${check(overview.notificationMethod === 'other')} 기타 ${overview.otherNotificationMethod || ''}` },
        { label: '산업재해 발생유무', value: overview.accidentOccurred },
        { label: '최근 발생일자', value: formatDate(overview.recentAccidentDate) },
        { label: '재해형태', value: overview.accidentType },
        { label: '재해개요', value: overview.accidentSummary },
      ])}</table>
      <div class="subsection-title">작업계획서 작성 확인(대상 13종)</div>
      <table class="info-table compact-table">${workPlanRows}</table>
      <div class="subsection-title">진행공정 및 특이사항</div>
      <div class="text-block">${lineBreaks(overview.processAndNotes || '-')}</div>
    `,
  };
}

function buildDoc3(session: InspectionSession): ReportPageDraft {
  const fixed = session.document3Scenes.slice(0, 2);
  const extra = session.document3Scenes.slice(2);

  return {
    body: `
      ${sectionTitle('3. 현장 전경 및 주요 진행공정')}
      <div class="image-grid">
        ${fixed
          .map(
            (scene, index) => `
              <div class="image-card">
                <div class="image-card-title">현장 전경 ${index + 1}</div>
                ${imageTag(scene.photoUrl, `현장 전경 ${index + 1}`)}
                <div class="image-caption">${valueText(scene.description)}</div>
              </div>
            `
          )
          .join('')}
      </div>
      ${
        extra.length > 0
          ? `<div class="subsection-title">추가 이미지</div><div class="image-grid">${extra
              .map(
                (scene) => `
                  <div class="image-card">
                    <div class="image-card-title">${valueText(scene.title, '추가 이미지')}</div>
                    ${imageTag(scene.photoUrl, scene.title || '추가 이미지')}
                    <div class="image-caption">${valueText(scene.description)}</div>
                  </div>
                `
              )
              .join('')}</div>`
          : ''
      }
    `,
  };
}

function buildDoc4(session: InspectionSession): ReportPageDraft {
  const blocks =
    session.document4FollowUps.length > 0
      ? session.document4FollowUps
      : [{ id: 'empty', location: '', guidanceDate: '', confirmationDate: '', beforePhotoUrl: '', afterPhotoUrl: '', result: '' }];

  return {
    body: `
      ${sectionTitle('4. 이전 기술지도 사항 이해여부')}
      ${blocks
        .map(
          (item, index) => `
            <div class="followup-block">
              <div class="subsection-title">후속조치 ${index + 1}</div>
              <table class="info-table compact-table">${infoRows([
                { label: '유해·위험장소', value: item.location },
                { label: '지도일', value: formatDate(item.guidanceDate) },
                { label: '확인일', value: formatDate(item.confirmationDate) },
                { label: '시정조치 결과', value: item.result },
              ])}</table>
              <div class="image-grid">
                <div class="image-card">${imageTag(item.beforePhotoUrl, '시정 전 사진')}<div class="image-caption">시정 전</div></div>
                <div class="image-card">${imageTag(item.afterPhotoUrl, '시정 후 사진')}<div class="image-caption">시정 후</div></div>
              </div>
            </div>
          `
        )
        .join('')}
    `,
  };
}

export function buildOverviewPages(session: InspectionSession): ReportPageDraft[] {
  return [buildCover(session), buildDoc1Doc2(session), buildDoc3(session), buildDoc4(session)];
}
