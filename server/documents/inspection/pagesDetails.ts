import 'server-only';

import { padDocument12Activities } from '@/constants/inspectionSession/itemFactory';
import type { InspectionSession } from '@/types/inspectionSession';
import {
  ReportPageDraft,
  causativeLabel,
  checklistLabel,
  countByLabel,
  imageTag,
  infoRows,
  lineBreaks,
  sectionTitle,
  valueText,
} from './format';

const riskLawText = [
  '산업안전보건법 제36조(위험성평가의 실시)',
  '사업주는 유해·위험 요인을 찾아내어 위험성을 평가하고, 그 결과에 따라 필요한 조치를 하여야 한다.',
  '사업주는 위험성평가 시 해당 작업장의 근로자를 참여시켜야 하며, 결과와 조치사항을 기록하여 보존하여야 한다.',
].join('\n');

function buildCountTable(title: string, entries: Array<{ label: string; count: number }>) {
  const rows =
    entries.length > 0
      ? entries
          .map((item) => `<tr><th>${valueText(item.label)}</th><td>${item.count}</td></tr>`)
          .join('')
      : '<tr><th>자료 없음</th><td>0</td></tr>';

  return `<div class="stats-card"><div class="subsection-title">${title}</div><table class="info-table compact-table">${rows}</table></div>`;
}

function buildDoc5And6(
  session: InspectionSession,
  siteSessions: InspectionSession[]
): ReportPageDraft {
  const currentFindings = session.document7Findings.filter(
    (item) => item.location || item.accidentType || item.causativeAgentKey || item.emphasis
  );
  const cumulativeFindings = siteSessions
    .filter((item) => item.reportNumber <= session.reportNumber)
    .flatMap((item) => item.document7Findings)
    .filter((item) => item.location || item.accidentType || item.causativeAgentKey || item.emphasis);
  const currentAccidents = countByLabel(currentFindings.map((item) => item.accidentType));
  const cumulativeAccidents = countByLabel(cumulativeFindings.map((item) => item.accidentType));
  const currentAgents = countByLabel(currentFindings.map((item) => causativeLabel(item.causativeAgentKey)));
  const cumulativeAgents = countByLabel(cumulativeFindings.map((item) => causativeLabel(item.causativeAgentKey)));

  return {
    body: `
      ${sectionTitle('5. 현재 공정내 현존하는 유해·위험요인 분류')}
      <div class="stats-grid">
        ${buildCountTable('지적유형별 분류(금회)', currentAccidents)}
        ${buildCountTable('지적유형별 분류(누적)', cumulativeAccidents)}
        ${buildCountTable('지적 기인물별 분류(금회)', currentAgents)}
        ${buildCountTable('지적 기인물별 분류(누적)', cumulativeAgents)}
      </div>
      <div class="subsection-title">기술지도 총평</div>
      <div class="text-block">${lineBreaks(session.document5Summary.summaryText || '-')}</div>
      ${sectionTitle('6. 건설현장 12대 사망사고 기인물 핵심 안전조치')}
      <table class="info-table compact-table">
        ${session.document6Measures
          .map(
            (item) =>
              `<tr><th>${item.number}. ${valueText(item.label)}</th><td>${item.checked ? '☑' : '☐'} ${valueText(item.guidance)}</td></tr>`
          )
          .join('')}
      </table>
    `,
  };
}

function buildDoc7Pages(session: InspectionSession): ReportPageDraft[] {
  const findings =
    session.document7Findings.filter(
      (item) => item.photoUrl || item.photoUrl2 || item.location || item.emphasis || item.improvementPlan
    ) || [];
  const fallback = session.document7Findings[0];
  const items = findings.length > 0 ? findings : fallback ? [fallback] : [];

  return items.map((item, index) => ({
    body: `
      ${sectionTitle('7. 현재 공정내 현존하는 유해·위험요인')}
      <div class="subsection-title">위험요인 ${index + 1}</div>
      <div class="image-grid" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;align-items:start;">${imageTag(item.photoUrl, `현장 사진 1`)}${imageTag(item.photoUrl2, `현장 사진 2`)}</div>
      <table class="info-table">${infoRows([
        { label: '유해·위험장소', value: item.location },
        { label: '위험도', value: `${item.likelihood || '-'} / ${item.severity || '-'} / ${item.riskLevel || '-'}` },
        { label: '재해유형', value: item.accidentType },
        { label: '기인물', value: causativeLabel(item.causativeAgentKey) },
        { label: '지도요원', value: item.inspector },
        { label: '강조사항', value: item.emphasis },
        { label: '개선대책', value: item.improvementPlan },
        { label: '관계법령', value: item.legalReferenceTitle },
        { label: '참고자료 1', value: item.referenceMaterial1 },
        { label: '참고자료 2', value: item.referenceMaterial2 },
      ])}</table>
    `,
  }));
}

function buildCheckTable(title: string, rows: Array<{ prompt: string; rating: 'good' | 'average' | 'poor' | ''; note: string }>) {
  return `<div class="subsection-title">${title}</div><table class="info-table compact-table">${rows
    .map((item) => `<tr><th>${valueText(item.prompt)}</th><td>${checklistLabel(item.rating)}${item.note ? ` / ${valueText(item.note)}` : ''}</td></tr>`)
    .join('')}</table>`;
}

export function buildDetailPages(
  session: InspectionSession,
  siteSessions: InspectionSession[]
): ReportPageDraft[] {
  return [
    buildDoc5And6(session, siteSessions),
    ...buildDoc7Pages(session),
    {
      body: `
        ${sectionTitle('8. 향후 진행공정에 대한 유해·위험요인 및 안전대책')}
        <table class="info-table">${session.document8Plans
          .map(
            (item) =>
              infoRows([
                { label: '향후 주요 작업공정', value: item.processName },
                { label: '위험요인', value: item.hazard },
                { label: '안전대책', value: item.countermeasure },
                { label: '비고', value: item.note },
              ])
          )
          .join('')}</table>
      `,
    },
    {
      body: `
        ${sectionTitle('9. 위험성평가 및 TBM 활성화 지도')}
        ${buildCheckTable('작업 전 TBM(안전점검회의)', session.document9SafetyChecks.tbm)}
        ${buildCheckTable('위험성평가', session.document9SafetyChecks.riskAssessment)}
        <div class="subsection-title">관련 법령</div>
        <div class="text-block">${lineBreaks(riskLawText)}</div>
      `,
    },
    {
      body: `
        ${sectionTitle('10. 계측점검 결과')}
        <table class="info-table">${session.document10Measurements
          .map(
            (item, index) =>
              `<tr><th colspan="2">계측 ${index + 1} · ${valueText(item.instrumentType)}</th></tr>${infoRows([
                { label: '측정위치', value: item.measurementLocation },
                { label: '측정치', value: item.measuredValue },
                { label: '안전기준', value: item.safetyCriteria },
                { label: '조치여부', value: item.actionTaken },
              ])}`
          )
          .join('')}</table>
      `,
    },
    {
      body: `
        ${sectionTitle('11. 안전교육 실적')}
        ${session.document11EducationRecords
          .map(
            (item, index) => `
              <div class="subsection-title">안전교육 ${index + 1}</div>
              <div class="image-grid">
                <div class="image-card">${imageTag(item.photoUrl, '교육 사진')}<div class="image-caption">교육 사진</div></div>
                <div class="image-card">${imageTag(item.materialUrl, '교육 자료')}<div class="image-caption">${valueText(item.materialName, '교육 자료')}</div></div>
              </div>
              <table class="info-table compact-table">
                <tr>
                  <th>참석인원</th>
                  <td>${valueText(item.attendeeCount)}</td>
                  <th>교육 주제</th>
                  <td>${valueText(item.topic)}</td>
                </tr>
                <tr>
                  <th>교육내용</th>
                  <td colspan="3">${item.content?.trim() ? lineBreaks(item.content) : '-'}</td>
                </tr>
              </table>
            `
          )
          .join('')}
        ${sectionTitle('12. 안전보건 활동실적')}
        <div class="case-grid">${padDocument12Activities(session.document12Activities)
          .slice(0, 1)
          .map(
            (item) => `
              <div class="case-card">
                <div class="case-card-photos">
                  ${imageTag(item.photoUrl, '활동 1 사진', 'case-image')}
                  ${imageTag(item.photoUrl2, '활동 2 사진', 'case-image')}
                </div>
                <table class="info-table compact-table">
                  <tr>
                    <th>활동 1 내용</th>
                    <td>${valueText(item.activityType)}</td>
                    <th>활동 2 내용</th>
                    <td>${valueText(item.content)}</td>
                  </tr>
                </table>
              </div>
            `
          )
          .join('')}</div>
      `,
    },
    {
      body: `
        ${sectionTitle('13. 최근 건설업 재해사례')}
        <div class="case-grid">${session.document13Cases
          .map(
            (item) => `
              <div class="case-card">
                ${imageTag(item.imageUrl, item.title, 'case-image')}
                <div class="case-title">${valueText(item.title)}</div>
                <div class="image-caption">${valueText(item.summary)}</div>
              </div>
            `
          )
          .join('')}</div>
      `,
    },
    {
      body: `
        ${sectionTitle('14. 안전정보 소식')}
        ${session.document14SafetyInfos
          .map(
            (item, index) => `
              <div class="subsection-title">안전정보 ${index + 1}</div>
              <div class="image-grid single-image">${imageTag(item.imageUrl, item.title, 'case-image')}</div>
              <table class="info-table compact-table">${infoRows([{ label: '제목', value: item.title }, { label: '내용', value: item.body }])}</table>
            `
          )
          .join('')}
      `,
    },
  ];
}
