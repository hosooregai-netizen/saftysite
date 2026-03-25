import 'server-only';

import { WORK_PLAN_ITEMS } from '@/constants/inspectionSession';
import { padDocument12Activities } from '@/constants/inspectionSession/itemFactory';
import { getSceneSlotTitle } from '@/constants/inspectionSession/scenePhotos';
import type { InspectionSession } from '@/types/inspectionSession';
import { causativeLabel, countByLabel, formatDate } from './format';
import type { InspectionDocContext } from './media';
import {
  gridTable,
  imageBlock,
  noteBox,
  pageBanner,
  pageBreak,
  pageFooter,
  paragraph,
  sectionHeading,
  subsectionHeading,
  table,
  textCell,
  titleBox,
  twoColTable,
  xmlCell,
} from './ooxml';

function labelImplementation(value: string) {
  if (value === 'implemented') return '이행';
  if (value === 'partial') return '부분 이행';
  if (value === 'not_implemented') return '불이행';
  return '-';
}

function labelAccident(value: string) {
  if (value === 'yes') return '발생';
  if (value === 'no') return '미발생';
  return '-';
}

function workPlanLabel(value: string) {
  if (value === 'written') return '작성';
  if (value === 'not_written') return '미작성';
  return '-';
}

function pairs<T>(items: T[]) {
  const rows: Array<[T, T | null]> = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push([items[index], items[index + 1] ?? null]);
  }
  return rows;
}

function sceneGrid(session: InspectionSession, context: InspectionDocContext) {
  const scenes = session.document3Scenes.slice(0, 6);
  while (scenes.length < 6) {
    scenes.push({ id: `placeholder-${scenes.length}`, title: '', photoUrl: '', description: '' });
  }
  const widths = [4600, 4600];
  return table(
    pairs(scenes).map(([left, right], rowIndex) =>
      [left, right].map((sceneValue, cellIndex) => {
        const scene = sceneValue ?? { id: `scene-${rowIndex}-${cellIndex}`, title: '', photoUrl: '', description: '' };
        const sceneIndex = rowIndex * 2 + cellIndex;
        const title =
          sceneIndex === 0
            ? '현장 전경 1'
            : sceneIndex === 1
              ? '현장 전경 2'
              : scene?.title?.trim() || getSceneSlotTitle(sceneIndex);
        const image = context.addImage(scene.photoUrl, {
          fallbackName: `scene-${scene.id}`,
          maxHeightPx: 300,
          maxWidthPx: 300,
        });
        return xmlCell(
          [
            paragraph(title, { align: 'center', bold: true, spacingAfter: 80 }),
            imageBlock(image, title, { align: 'center', spacingAfter: 80 }),
            paragraph(' ', { align: 'center' }),
          ].join(''),
          { verticalAlign: 'center' }
        );
      })
    ),
    widths,
    { width: 9200 }
  );
}

function followUpBlock(session: InspectionSession, context: InspectionDocContext, item: InspectionSession['document4FollowUps'][number], index: number) {
  const beforeImage = context.addImage(item.beforePhotoUrl, {
    fallbackName: `followup-before-${item.id}`,
    maxHeightPx: 210,
    maxWidthPx: 260,
  });
  const afterImage = context.addImage(item.afterPhotoUrl, {
    fallbackName: `followup-after-${item.id}`,
    maxHeightPx: 210,
    maxWidthPx: 260,
  });
  return [
    subsectionHeading(`이행여부 ${index + 1}`),
    table(
      [
        [
          textCell('유해·위험장소', { bold: true, shaded: true }),
          textCell(item.location || '-', { colSpan: 3 }),
        ],
        [
          textCell('지도일', { bold: true, shaded: true }),
          textCell(formatDate(item.guidanceDate)),
          textCell('확인일', { bold: true, shaded: true }),
          textCell(formatDate(item.confirmationDate || session.meta.reportDate)),
        ],
        [
          textCell('시정 전 사진', { bold: true, shaded: true, colSpan: 2, align: 'center' }),
          textCell('시정 후 사진', { bold: true, shaded: true, colSpan: 2, align: 'center' }),
        ],
        [
          xmlCell(imageBlock(beforeImage, '시정 전 사진', { align: 'center' }), { colSpan: 2 }),
          xmlCell(imageBlock(afterImage, '시정 후 사진', { align: 'center' }), { colSpan: 2 }),
        ],
        [
          textCell('[시정조치 결과]', { bold: true, shaded: true, colSpan: 4 }),
        ],
        [
          textCell(item.result || '-', { colSpan: 4 }),
        ],
      ],
      [2300, 2300, 2300, 2300],
      { width: 9200 }
    ),
  ].join('');
}

function measuresTable(session: InspectionSession) {
  return gridTable(
    pairs(session.document6Measures).map(([left, right]) => [
      `${left.checked ? '☑' : '☐'} ${left.number}. ${left.label}`,
      left.guidance || '-',
      right ? `${right.checked ? '☑' : '☐'} ${right.number}. ${right.label}` : '',
      right?.guidance || '',
    ]),
    [1700, 2900, 1700, 2900]
  );
}

function findingPage(session: InspectionSession, context: InspectionDocContext, item: InspectionSession['document7Findings'][number], index: number) {
  const mainImage = context.addImage(item.photoUrl, {
    fallbackName: `finding-${item.id}-1`,
    maxHeightPx: 260,
    maxWidthPx: 320,
  });
  const secondImage = context.addImage(item.photoUrl2, {
    fallbackName: `finding-${item.id}-2`,
    maxHeightPx: 260,
    maxWidthPx: 320,
  });
  const ref1 = context.addImage(item.referenceMaterial1, {
    fallbackName: `finding-ref1-${item.id}`,
    maxHeightPx: 170,
    maxWidthPx: 220,
  });
  const ref2 = context.addImage(item.referenceMaterial2, {
    fallbackName: `finding-ref2-${item.id}`,
    maxHeightPx: 170,
    maxWidthPx: 220,
  });
  return [
    pageBanner(),
    sectionHeading('7.현재 공정내 현존하는 유해·위험요인'),
    subsectionHeading(`위험요인 ${index + 1}`),
    table(
      [
        [
          textCell('유해·위험장소', { bold: true, shaded: true }),
          textCell(item.location || '-'),
          textCell('위험도', { bold: true, shaded: true }),
          textCell(item.riskLevel || `${item.likelihood || '-'} / ${item.severity || '-'}`),
          textCell('재해유형', { bold: true, shaded: true }),
          textCell(item.accidentType || '-'),
        ],
        [
          xmlCell(imageBlock(mainImage, '현장 사진 1', { align: 'center' }), { colSpan: 2, verticalAlign: 'center' }),
          xmlCell(
            secondImage
              ? imageBlock(secondImage, '현장 사진 2', { align: 'center' })
              : paragraph('현장 사진 2 없음', { align: 'center' }),
            { colSpan: 2, verticalAlign: 'center' }
          ),
          xmlCell(
            [
              paragraph(`기인물: ${causativeLabel(item.causativeAgentKey)}`, { bold: true, spacingAfter: 80 }),
              paragraph(`지도요원: ${item.inspector || session.meta.drafter || '-'}`, { spacingAfter: 80 }),
              paragraph(`강조사항: ${item.emphasis || '-'}`),
            ].join(''),
            { colSpan: 2 }
          ),
        ],
        [
          textCell('개선대책', { bold: true, shaded: true, colSpan: 6 }),
        ],
        [
          textCell(item.improvementPlan || '-', { colSpan: 6 }),
        ],
        [
          textCell('관계법령', { bold: true, shaded: true }),
          textCell(item.legalReferenceTitle || '-', { colSpan: 5 }),
        ],
        [
          textCell('참고자료 예시 1', { bold: true, shaded: true, colSpan: 3, align: 'center' }),
          textCell('참고자료 예시 2', { bold: true, shaded: true, colSpan: 3, align: 'center' }),
        ],
        [
          xmlCell(ref1 ? imageBlock(ref1, '참고자료 예시 1', { align: 'center' }) : paragraph(item.referenceMaterial1 || '자료 없음', { align: 'center' }), { colSpan: 3 }),
          xmlCell(ref2 ? imageBlock(ref2, '참고자료 예시 2', { align: 'center' }) : paragraph(item.referenceMaterial2 || '자료 없음', { align: 'center' }), { colSpan: 3 }),
        ],
      ],
      [1500, 1600, 1200, 1200, 1200, 2500],
      { width: 9200 }
    ),
  ].join('');
}

function educationAndActivities(session: InspectionSession, context: InspectionDocContext) {
  const sections: string[] = [pageBanner(), sectionHeading('11.안전교육 실적')];
  session.document11EducationRecords.forEach((item, index) => {
    const photo = context.addImage(item.photoUrl, {
      fallbackName: `education-photo-${item.id}`,
      maxHeightPx: 190,
      maxWidthPx: 270,
    });
    const material = context.addImage(item.materialUrl, {
      fallbackName: `education-material-${item.id}`,
      maxHeightPx: 190,
      maxWidthPx: 270,
    });
    sections.push(
      subsectionHeading(`교육 ${index + 1}`),
      table(
        [
          [
            textCell('교육 사진', { bold: true, shaded: true, align: 'center' }),
            textCell('교육 자료', { bold: true, shaded: true, align: 'center' }),
          ],
          [
            xmlCell(imageBlock(photo, '교육 사진', { align: 'center' })),
            xmlCell(
              material
                ? imageBlock(material, '교육 자료', { align: 'center' })
                : paragraph(item.materialName || '자료 파일 첨부됨', { align: 'center' })
            ),
          ],
        ],
        [4600, 4600],
        { width: 9200 }
      ),
      paragraph(`[교육내용]`, { bold: true, spacingBefore: 80 }),
      paragraph(`참석인원 : ${item.attendeeCount || '-'}명 · 교육 주제 : ${item.topic || '-'}`),
      paragraph(item.content || '-')
    );
  });
  sections.push(sectionHeading('12.안전보건 활동실적'));
  sections.push(activityGrid(session, context));
  return sections.join('');
}

function activityGrid(session: InspectionSession, context: InspectionDocContext) {
  const padded = padDocument12Activities(session.document12Activities);
  const item = padded[0] ?? {
    id: 'activity-placeholder',
    photoUrl: '',
    photoUrl2: '',
    activityType: '',
    content: '',
  };
  const activityPhoto = context.addImage(item.photoUrl, {
    fallbackName: `activity-photo-${item.id}`,
    maxHeightPx: 180,
    maxWidthPx: 250,
  });
  const activityPhoto2 = context.addImage(item.photoUrl2, {
    fallbackName: `activity-photo2-${item.id}`,
    maxHeightPx: 180,
    maxWidthPx: 250,
  });
  const titleText = [item.activityType, item.content].filter((t) => String(t).trim()).join(' · ') || '-';
  return table(
    [
      [
        xmlCell(
          table(
            [
              [textCell(titleText, { bold: true, shaded: true, align: 'center', colSpan: 2 })],
              [
                xmlCell(imageBlock(activityPhoto, '활동 1 사진', { align: 'center' })),
                xmlCell(imageBlock(activityPhoto2, '활동 2 사진', { align: 'center' })),
              ],
            ],
            [4600, 4600],
            { width: 9200 }
          )
        ),
      ],
    ],
    [9200],
    { width: 9200 }
  );
}

function caseGrid(session: InspectionSession, context: InspectionDocContext) {
  const cards = [...session.document13Cases];
  while (cards.length < 4) {
    cards.push({ id: `placeholder-${cards.length}`, imageUrl: '', summary: '표시할 사례 데이터가 아직 없습니다.', title: '자료 없음' });
  }
  return table(
    pairs(cards.slice(0, 4)).map(([left, right]) =>
      [left, right].map((itemValue, cellIndex) => {
        const item = itemValue ?? { id: `case-${cellIndex}`, imageUrl: '', summary: '표시할 사례 데이터가 아직 없습니다.', title: '자료 없음' };
        const image = context.addImage(item.imageUrl, {
          fallbackName: `case-${item.id}`,
          maxHeightPx: 180,
          maxWidthPx: 250,
        });
        return (
        xmlCell(
          [
            image ? imageBlock(image, item.title, { align: 'center', spacingAfter: 70 }) : paragraph('자료 없음', { align: 'center', spacingAfter: 70 }),
            paragraph(item.title, { bold: true, align: 'center', spacingAfter: 40 }),
            paragraph(item.summary || ' '),
          ].join('')
        )
        );
      })
    ),
    [4600, 4600],
    { width: 9200 }
  );
}

export function buildInspectionDocumentBody(
  session: InspectionSession,
  siteSessions: InspectionSession[],
  context: InspectionDocContext
) {
  const site = session.adminSiteSnapshot;
  const overview = session.document2Overview;
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
  let page = 1;

  const content = [
    paragraph(' ', { spacingAfter: 700 }),
    titleBox('건설재해예방 기술지도결과보고서'),
    paragraph(`현장명 : ${session.meta.siteName || site.siteName || '-'}`, { align: 'center', spacingBefore: 120, spacingAfter: 1200 }),
    paragraph(formatDate(session.meta.reportDate), { align: 'center', spacingAfter: 1200 }),
    gridTable(
      [
        ['담 당', '검 토', '승 인'],
        [session.meta.drafter || '', session.meta.reviewer || '', session.meta.approver || ''],
      ],
      [3066, 3066, 3068],
      1
    ),
    paragraph(`${site.companyName || '한국종합안전주식회사'}`, { align: 'center', bold: true, size: 32, spacingBefore: 220, spacingAfter: 70 }),
    paragraph(`${site.headquartersAddress || '-'}`, { align: 'center', spacingAfter: 40 }),
    paragraph(`${site.headquartersContact || '-'}`, { align: 'center' }),
    pageBreak(),

    pageBanner(),
    sectionHeading('1.기술지도 대상사업장'),
    table(
      [
        [textCell('현장', { bold: true, shaded: true, align: 'center', colSpan: 4 })],
        [textCell('현장명', { bold: true, shaded: true }), textCell(site.siteName || '-'), textCell('사업장관리번호\n(사업개시번호)', { bold: true, shaded: true }), textCell(`${site.siteManagementNumber || '-'} / ${site.businessStartNumber || '-'}`)],
        [textCell('공사기간', { bold: true, shaded: true }), textCell(site.constructionPeriod || '-'), textCell('공사금액', { bold: true, shaded: true }), textCell(site.constructionAmount || '-')],
        [textCell('책임자', { bold: true, shaded: true }), textCell(site.siteManagerName || '-'), textCell('연락처(이메일)', { bold: true, shaded: true }), textCell(site.siteContactEmail || '-')],
        [textCell('현장주소', { bold: true, shaded: true }), textCell(site.siteAddress || '-', { colSpan: 3 })],
        [textCell('본사', { bold: true, shaded: true, align: 'center', colSpan: 4 })],
        [textCell('회사명', { bold: true, shaded: true }), textCell(site.companyName || '-'), textCell('법인등록번호\n(사업자등록번호)', { bold: true, shaded: true }), textCell(`${site.corporationRegistrationNumber || '-'} / ${site.businessRegistrationNumber || '-'}`)],
        [textCell('면허번호', { bold: true, shaded: true }), textCell(site.licenseNumber || '-'), textCell('연락처', { bold: true, shaded: true }), textCell(site.headquartersContact || '-')],
        [textCell('본사주소', { bold: true, shaded: true }), textCell(site.headquartersAddress || '-', { colSpan: 3 })],
      ],
      [1600, 3000, 1800, 2800],
      { width: 9200 }
    ),
    sectionHeading('2.기술지도개요'),
    table(
      [
        [textCell('지도기관명', { bold: true, shaded: true }), textCell(overview.guidanceAgencyName || '한국종합안전주식회사'), textCell('기술지도실시일', { bold: true, shaded: true }), textCell(formatDate(overview.guidanceDate))],
        [textCell('공사구분', { bold: true, shaded: true }), textCell(overview.constructionType || '건설공사'), textCell('공정률', { bold: true, shaded: true }), textCell(overview.progressRate || '-')],
        [textCell('횟수', { bold: true, shaded: true }), textCell(`(${overview.visitCount || '-'})회차 / 총(${overview.totalVisitCount || '-'})회`), textCell('담당요원', { bold: true, shaded: true }), textCell(overview.assignee || session.meta.drafter || '-')],
        [textCell('이전기술지도 이행여부', { bold: true, shaded: true }), textCell(labelImplementation(overview.previousImplementationStatus)), textCell('연락처', { bold: true, shaded: true }), textCell(overview.contact || '-')],
        [textCell('현장책임자 등 통보 방법', { bold: true, shaded: true }), textCell(`${overview.notificationRecipientName || '-'} / ${overview.notificationMethod || '-'}`, { colSpan: 3 })],
      ],
      [1800, 2800, 1800, 2800],
      { width: 9200 }
    ),
    subsectionHeading('작업계획서 작성 확인(대상12종)'),
    gridTable(
      pairs(WORK_PLAN_ITEMS).map(([left, right]) => [
        left.label,
        workPlanLabel(overview.workPlanChecks[left.key]),
        right?.label || '',
        right ? workPlanLabel(overview.workPlanChecks[right.key]) : '',
      ]),
      [2600, 2000, 2600, 2000]
    ),
    twoColTable([
      { label: '산업재해 발생유무', value: labelAccident(overview.accidentOccurred) },
      { label: '최근 발생일자', value: formatDate(overview.recentAccidentDate) },
      { label: '재해형태', value: overview.accidentType || '-' },
      { label: '재해개요', value: overview.accidentSummary || '-' },
    ]),
    subsectionHeading('진행공정 및 특이사항'),
    noteBox(overview.processAndNotes || '-'),
    pageFooter(page++),
    pageBreak(),

    pageBanner(),
    sectionHeading('3.현장 전경 및 주요 진행공정'),
    sceneGrid(session, context),
    pageFooter(page++),
    pageBreak(),

    pageBanner(),
    sectionHeading('4.이전 기술지도 사항 이행여부'),
    ...(session.document4FollowUps.length > 0
      ? session.document4FollowUps.map((item, index) => followUpBlock(session, context, item, index))
      : [noteBox('이전 기술지도 사항이 없습니다.')]),
    pageFooter(page++),
    pageBreak(),

    pageBanner(),
    sectionHeading('5.현재 공정내 현존하는 유해·위험요인 분류'),
    twoColTable(currentAccidents.map((item) => ({ label: `지적유형별 분류(금회) · ${item.label}`, value: String(item.count) }))),
    twoColTable(cumulativeAccidents.map((item) => ({ label: `지적유형별 분류(누적) · ${item.label}`, value: String(item.count) }))),
    twoColTable(currentAgents.map((item) => ({ label: `지적 기인물별 분류(금회) · ${item.label}`, value: String(item.count) }))),
    twoColTable(cumulativeAgents.map((item) => ({ label: `지적 기인물별 분류(누적) · ${item.label}`, value: String(item.count) }))),
    subsectionHeading('[기술지도 총평]'),
    noteBox(session.document5Summary.summaryText || '-'),
    sectionHeading('6.건설현장 12대 사망사고 기인물 핵심 안전조치'),
    measuresTable(session),
    pageFooter(page++),
    pageBreak(),

    ...session.document7Findings
      .filter((item) => item.photoUrl || item.photoUrl2 || item.location || item.emphasis || item.improvementPlan)
      .flatMap((item, index) => [findingPage(session, context, item, index), pageFooter(page++), pageBreak()]),

    pageBanner(),
    sectionHeading('8.향 후 진행공정에 대한 유해·위험요인 및 안전대책'),
    table(
      [
        [
          textCell('향 후 주요 작업공정', { bold: true, shaded: true, align: 'center' }),
          textCell('위험요인', { bold: true, shaded: true, align: 'center' }),
          textCell('안전대책', { bold: true, shaded: true, align: 'center' }),
        ],
        ...session.document8Plans.map((item) => [
          textCell(item.processName || '-'),
          textCell(item.hazard || '-'),
          textCell(item.countermeasure || (item.note || '-')),
        ]),
      ],
      [2600, 3300, 3300],
      { width: 9200 }
    ),
    pageFooter(page++),
    pageBreak(),

    pageBanner(),
    sectionHeading('9.위험성평가 및 TBM 활성화 지도'),
    subsectionHeading('작업 전 TBM(안전점검 회의)'),
    gridTable(
      [['내용', '양호', '보통', '미흡', '비고']].concat(
        session.document9SafetyChecks.tbm.map((item) => [
          item.prompt,
          item.rating === 'good' ? '●' : '',
          item.rating === 'average' ? '●' : '',
          item.rating === 'poor' ? '●' : '',
          item.note || '',
        ])
      ),
      [3800, 1100, 1100, 1100, 2100],
      1
    ),
    subsectionHeading('위험성평가'),
    gridTable(
      [['내용', '양호', '보통', '미흡', '비고']].concat(
        session.document9SafetyChecks.riskAssessment.map((item) => [
          item.prompt,
          item.rating === 'good' ? '●' : '',
          item.rating === 'average' ? '●' : '',
          item.rating === 'poor' ? '●' : '',
          item.note || '',
        ])
      ),
      [3800, 1100, 1100, 1100, 2100],
      1
    ),
    pageFooter(page++),
    pageBreak(),

    pageBanner(),
    sectionHeading('10.계측점검 결과'),
    ...session.document10Measurements.map((item, index) =>
      [
        subsectionHeading(item.instrumentType || `계측 ${index + 1}`),
        twoColTable([
          { label: '측정위치', value: item.measurementLocation || '-' },
          { label: '측정치', value: item.measuredValue || '-' },
          { label: '안전기준', value: item.safetyCriteria || '-' },
          { label: '조치여부', value: item.actionTaken || '-' },
        ]),
      ].join('')
    ),
    pageFooter(page++),
    pageBreak(),

    educationAndActivities(session, context),
    pageFooter(page++),
    pageBreak(),

    pageBanner(),
    sectionHeading('13.최근 건설업 재해사례'),
    caseGrid(session, context),
    pageFooter(page++),
    pageBreak(),

    pageBanner(),
    sectionHeading('14.안전정보 소식'),
    (() => {
      const info = session.document14SafetyInfos[0];
      const infoImage = context.addImage(info?.imageUrl || '', {
        fallbackName: 'safety-info',
        maxHeightPx: 340,
        maxWidthPx: 520,
      });
      return table(
        [
          [
            xmlCell(
              [
                imageBlock(infoImage, info?.title || '안전정보', { align: 'center', spacingAfter: 90 }),
                paragraph(info?.title || '안전정보', { align: 'center', bold: true, spacingAfter: 50 }),
                paragraph(info?.body || '표시할 안전 정보가 아직 없습니다.'),
              ].join(''),
              { verticalAlign: 'center' }
            ),
          ],
        ],
        [9200],
        { width: 9200 }
      );
    })(),
    pageFooter(page++),
    pageBreak(),

    pageBanner(),
    sectionHeading('15.안심일터 확인사항(고용노동부 지시)'),
    noteBox('현재 앱 데이터 모델은 14번 문서까지만 연결되어 있어, 15번 안심일터 확인사항은 다음 단계에서 데이터 연동이 필요합니다.'),
    pageFooter(page++),
  ];

  return content.join('');
}
