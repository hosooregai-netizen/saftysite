import { reportPayloadSchema, type ReportPayload } from '@saftysite/contracts';
import {
  createInspectionSession,
  createEmptyTechnicalGuidanceRelations,
} from '../../../constants/inspectionSession/sessionFactory';
import {
  createActivityRecord,
  createCurrentHazardFinding,
  createFutureProcessRiskPlan,
  createPreviousGuidanceFollowUpItem,
  createSafetyEducationRecord,
  padDocument12Activities,
} from '../../../constants/inspectionSession/itemFactory';
import type { InspectionSectionKey } from '../../../types/inspectionSession/base';
import type { InspectionSession } from '../../../types/inspectionSession/session';

function safeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toSessionSectionKey(sectionKey: string): InspectionSectionKey {
  if (sectionKey === 'doc1' || sectionKey === 'section1') return 'doc1';
  if (sectionKey === 'doc2' || sectionKey === 'section2') return 'doc2';
  if (
    sectionKey === 'doc3' ||
    sectionKey === 'doc4' ||
    sectionKey === 'section3' ||
    sectionKey === 'photo-step-1' ||
    sectionKey === 'photo-step-2'
  ) {
    return 'doc3';
  }
  if (
    sectionKey === 'doc5' ||
    sectionKey === 'doc7' ||
    sectionKey === 'section4' ||
    sectionKey === 'review' ||
    sectionKey === 'photo-review' ||
    sectionKey === 'ai-generating'
  ) {
    return 'doc7';
  }
  if (sectionKey === 'doc8' || sectionKey === 'section5') return 'doc8';
  return 'doc11';
}

function buildReportTitle(report: ReportPayload): string {
  const visitDate = report.reportMeta.visitDate || report.createdAt.slice(0, 10);
  return `${visitDate} 기술지도 보고서`;
}

function getOverviewPhotos(report: ReportPayload) {
  return report.photoEvidence.filter((photo) => photo.sourceStep === 'step1_overview');
}

function getHazardPhotos(report: ReportPayload) {
  return report.photoEvidence.filter(
    (photo) =>
      photo.sourceStep === 'step2_hazard' ||
      photo.sourceStep === 'manual_override' ||
      photo.category === 'hazard',
  );
}

function getLinkedPhotos(report: ReportPayload, linkedPhotoIds: string[]) {
  return report.photoEvidence.filter((photo) => linkedPhotoIds.includes(photo.photoAssetId));
}

function buildSummaryText(report: ReportPayload): string {
  if (safeText(report.sectionDrafts.doc5.futureProcessFocus)) {
    return safeText(report.sectionDrafts.doc5.futureProcessFocus);
  }
  return [
    report.sectionDrafts.doc5.progressOverview,
    report.sectionDrafts.doc5.workEnvironmentRisk,
    report.sectionDrafts.doc5.findingCase,
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildSpecialNotes(report: ReportPayload) {
  return [report.reportMeta.processSummary, report.sectionDrafts.doc5.accidentTrend]
    .filter((value) => safeText(value))
    .join('\n\n');
}

export function mapReportPayloadToInspectionSession(
  reportId: string,
  rawReport: ReportPayload,
): InspectionSession {
  const report = reportPayloadSchema.parse(rawReport);
  const overviewPhotos = getOverviewPhotos(report);
  const hazardPhotos = getHazardPhotos(report);
  const followUps = Array.isArray(report.documentsCompat.document4FollowUps)
    ? report.documentsCompat.document4FollowUps
    : [];
  const session = createInspectionSession(
    {
      meta: {
        siteName: report.reportMeta.siteName,
        reportDate: report.reportMeta.visitDate,
        reportTitle: buildReportTitle(report),
        drafter: report.reportMeta.drafterName,
      },
      adminSiteSnapshot: {
        customerName: report.reportMeta.customerName,
        siteName: report.reportMeta.siteName,
        assigneeName: report.reportMeta.drafterName,
        siteManagementNumber: safeText(report.reportMeta.siteManagementNumber),
        businessStartNumber: safeText(report.reportMeta.businessStartNumber),
        constructionPeriod: safeText(report.reportMeta.constructionPeriod),
        constructionAmount: safeText(report.reportMeta.constructionAmount),
        siteManagerName: safeText(report.reportMeta.siteManagerName),
        siteAddress: report.reportMeta.siteAddress,
        siteContactEmail: report.reportMeta.siteContact,
        companyName: report.reportMeta.customerName,
        corporationRegistrationNumber: safeText(report.reportMeta.corporationRegistrationNumber),
        businessRegistrationNumber: safeText(report.reportMeta.businessRegistrationNumber),
        licenseNumber: safeText(report.reportMeta.licenseNumber),
        headquartersContact: safeText(report.reportMeta.headquartersContact),
        headquartersAddress: safeText(report.reportMeta.headquartersAddress),
      },
      technicalGuidanceRelations: createEmptyTechnicalGuidanceRelations(),
    },
    report.workspaceId,
    1,
  );

  session.id = reportId;
  session.currentSection = toSessionSectionKey(report.currentSection);
  session.createdAt = report.createdAt;
  session.updatedAt = report.updatedAt;
  session.meta.reportTitle = buildReportTitle(report);
  session.adminSiteSnapshot.customerName = report.reportMeta.customerName;
  session.adminSiteSnapshot.siteName = report.reportMeta.siteName;
  session.adminSiteSnapshot.assigneeName = report.reportMeta.drafterName;
  session.adminSiteSnapshot.siteManagementNumber = safeText(report.reportMeta.siteManagementNumber);
  session.adminSiteSnapshot.businessStartNumber = safeText(report.reportMeta.businessStartNumber);
  session.adminSiteSnapshot.constructionPeriod = safeText(report.reportMeta.constructionPeriod);
  session.adminSiteSnapshot.constructionAmount = safeText(report.reportMeta.constructionAmount);
  session.adminSiteSnapshot.siteManagerName = safeText(report.reportMeta.siteManagerName);
  session.adminSiteSnapshot.siteAddress = report.reportMeta.siteAddress;
  session.adminSiteSnapshot.siteContactEmail = report.reportMeta.siteContact;
  session.adminSiteSnapshot.companyName = report.reportMeta.customerName;
  session.adminSiteSnapshot.corporationRegistrationNumber = safeText(
    report.reportMeta.corporationRegistrationNumber,
  );
  session.adminSiteSnapshot.businessRegistrationNumber = safeText(
    report.reportMeta.businessRegistrationNumber,
  );
  session.adminSiteSnapshot.licenseNumber = safeText(report.reportMeta.licenseNumber);
  session.adminSiteSnapshot.headquartersContact = safeText(report.reportMeta.headquartersContact);
  session.adminSiteSnapshot.headquartersAddress = safeText(report.reportMeta.headquartersAddress);
  session.document2Overview.guidanceAgencyName = safeText(report.reportMeta.guidanceAgencyName);
  session.document2Overview.guidanceDate = report.reportMeta.visitDate;
  session.document2Overview.constructionType = safeText(report.reportMeta.constructionType);
  session.document2Overview.progressRate = report.reportMeta.progressRate;
  session.document2Overview.visitCount = safeText(report.reportMeta.visitCount);
  session.document2Overview.totalVisitCount = safeText(report.reportMeta.totalVisitCount);
  session.document2Overview.assignee = report.reportMeta.drafterName;
  session.document2Overview.previousImplementationStatus = report.reportMeta.previousImplementationStatus;
  session.document2Overview.contact = report.reportMeta.siteContact;
  session.document2Overview.notificationMethod = report.reportMeta.notificationMethod;
  session.document2Overview.notificationRecipientName = safeText(
    report.reportMeta.notificationRecipientName,
  );
  session.document2Overview.otherNotificationMethod = safeText(
    report.reportMeta.otherNotificationMethod,
  );
  session.document2Overview.processWorkerCount = report.reportMeta.workerCount;
  session.document2Overview.processWorkContent = report.reportMeta.processSummary;
  session.document2Overview.processAndNotes = buildSpecialNotes(report);
  session.document2Overview.processWorkLocation = report.reportMeta.siteAddress;

  overviewPhotos.slice(0, session.document3Scenes.length).forEach((photo, index) => {
    session.document3Scenes[index] = {
      ...session.document3Scenes[index],
      photoUrl: photo.imageUrl,
      description: photo.locationHint || photo.filename || photo.sceneType,
    };
  });

  session.document5Summary.summaryText = buildSummaryText(report);
  if (followUps.length > 0) {
    session.document4FollowUps = followUps.map((item, index) => {
      const source = (item ?? {}) as Record<string, unknown>;
      return createPreviousGuidanceFollowUpItem({
        id: typeof source.id === 'string' ? source.id : `follow-up-${index + 1}`,
        location: typeof source.location === 'string' ? source.location : '',
        hazardDescription:
          typeof source.hazardDescription === 'string'
            ? source.hazardDescription
            : typeof source.issue === 'string'
              ? source.issue
              : '',
        guidanceDate: typeof source.guidanceDate === 'string' ? source.guidanceDate : '',
        confirmationDate: typeof source.confirmationDate === 'string' ? source.confirmationDate : '',
        beforePhotoUrl: typeof source.beforePhotoUrl === 'string' ? source.beforePhotoUrl : '',
        afterPhotoUrl: typeof source.afterPhotoUrl === 'string' ? source.afterPhotoUrl : '',
        actionRequired:
          typeof source.actionRequired === 'string' ? source.actionRequired : '',
        result: typeof source.result === 'string' ? source.result : '',
      });
    });
  }

  session.document7Findings =
    report.findingCandidates.length > 0
      ? report.findingCandidates.map((finding, index) => {
          const linked = getLinkedPhotos(report, finding.linkedPhotoIds);
          return createCurrentHazardFinding({
            photoUrl: linked[0]?.imageUrl || '',
            photoUrl2: linked[1]?.imageUrl || '',
            location: finding.location,
            hazardDescription: finding.hazardDescription,
            riskLevel: finding.riskLevel,
            accidentType: finding.accidentType,
            causativeAgentKey: finding.causativeAgentKey as InspectionSession['document7Findings'][number]['causativeAgentKey'],
            inspector: report.reportMeta.drafterName,
            emphasis: finding.emphasis,
            improvementPlan: finding.improvementPlan,
            legalReferenceTitle: finding.legalReferenceCandidates.join(', '),
            referenceLawTitles: finding.legalReferenceCandidates,
            referenceMaterial1: finding.referenceMaterialCandidates[0] || '',
            referenceMaterial2: finding.referenceMaterialCandidates[1] || '',
            referenceCatalogAccidentType: finding.accidentType,
            referenceCatalogCausativeAgentKey: finding.causativeAgentKey,
            metadata: `finding-${index + 1}`,
          });
        })
      : session.document7Findings;

  session.document8Plans =
    report.sectionDrafts.doc8.length > 0
      ? report.sectionDrafts.doc8.map((plan) =>
          createFutureProcessRiskPlan({
            processName: plan.processName,
            hazard: plan.hazard,
            countermeasure: plan.countermeasure,
            note: safeText(plan.note),
            source: 'api',
          }),
        )
      : session.document8Plans;

  session.document11EducationRecords =
    report.sectionDrafts.doc11.length > 0
      ? report.sectionDrafts.doc11.map((item, index) =>
          createSafetyEducationRecord({
            topic: item.topic,
            attendeeCount: item.attendeeCount ?? '',
            content: item.content,
            photoUrl: overviewPhotos[index]?.imageUrl || '',
          }),
        )
      : session.document11EducationRecords;

  session.document12Activities = padDocument12Activities(
    report.sectionDrafts.doc12.map((item, index) =>
      createActivityRecord({
        activityType: item.activityType,
        content: item.content,
        photoUrl: hazardPhotos[index]?.imageUrl || '',
        photoUrl2: overviewPhotos[index]?.imageUrl || '',
      }),
    ),
  );

  if (report.sectionDrafts.doc13.length > 0) {
    session.document13Cases = report.sectionDrafts.doc13.map((item, index) => ({
      id: `case-${index + 1}`,
      title: item.title,
      summary: item.summary,
      imageUrl: hazardPhotos[index]?.imageUrl || overviewPhotos[index]?.imageUrl || '',
    }));
  }

  if (report.sectionDrafts.doc14.title || report.sectionDrafts.doc14.body) {
    session.document14SafetyInfos = [
      {
        id: 'safety-info-1',
        title: report.sectionDrafts.doc14.title || '기타 사항',
        body: report.sectionDrafts.doc14.body,
        imageUrl: overviewPhotos[0]?.imageUrl || '',
      },
    ];
  }

  return session;
}
