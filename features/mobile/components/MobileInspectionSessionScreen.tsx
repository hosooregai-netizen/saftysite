'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import LoginPanel from '@/components/auth/LoginPanel';
import SignaturePad from '@/components/ui/SignaturePad';
import { getSessionGuidanceDate, getSessionTitle } from '@/constants/inspectionSession';
import { useInspectionSessionScreen } from '@/features/inspection-session/hooks/useInspectionSessionScreen';
import {
  buildMobileHomeHref,
  buildMobileSiteReportsHref,
} from '@/features/home/lib/siteEntry';
import { MobileShell } from './MobileShell';
import { MobileTabBar } from './MobileTabBar';
import { buildSiteTabs } from '../lib/buildSiteTabs';
import styles from './MobileShell.module.css';
import tabStyles from './MobileStepTabs.module.css';

interface MobileInspectionSessionScreenProps {
  sessionId: string;
}

const STEPS = [
  { id: 'step2', label: '개요' },
  { id: 'step3', label: '현장 전경' },
  { id: 'step4', label: '이전 지적' },
  { id: 'step6', label: '사망 기인물' },
  { id: 'step7', label: '위험요인 지적' },
  { id: 'step8', label: '향후 진행공정' },
  { id: 'step9', label: '위험성평가 / TBM' },
  { id: 'step10', label: '계측점검' },
  { id: 'step11', label: '안전교육' },
  { id: 'step12', label: '활동 실적' },
];

function formatCompactDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return '미기록';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

function StandaloneState({
  action,
  description,
  title,
}: {
  action?: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <main className="app-page">
      <div className={styles.pageShell}>
        <div className={styles.content}>
          <section className={styles.stateCard}>
            <div className={styles.sectionTitleWrap}>
              <span className={styles.sectionEyebrow}>모바일 보고서</span>
              <h1 className={styles.sectionTitle}>{title}</h1>
            </div>
            {description ? <p className={styles.inlineNotice}>{description}</p> : null}
            {action}
          </section>
        </div>
      </div>
    </main>
  );
}

export function MobileInspectionSessionScreen({
  sessionId,
}: MobileInspectionSessionScreenProps) {
  const screen = useInspectionSessionScreen(sessionId);
  const displaySession = screen.displaySession;
  const [activeStep, setActiveStep] = useState(STEPS[0].id);

  if (!screen.isReady) {
    return <StandaloneState title="보고서를 준비하는 중입니다." />;
  }

  if (!screen.isAuthenticated) {
    return (
      <LoginPanel
        error={screen.authError}
        onSubmit={screen.login}
        title="모바일 보고서 로그인"
        description="핵심 섹션 중심으로 기술지도 보고서를 이어서 작성합니다."
      />
    );
  }

  if (screen.isLoadingSession && !displaySession) {
    return <StandaloneState title="보고서를 불러오는 중입니다." />;
  }

  if (!displaySession || !screen.displayProgress) {
    return (
      <StandaloneState
        title="보고서를 찾을 수 없습니다."
        description="보고서가 아직 동기화되지 않았거나 접근 가능한 범위를 벗어났습니다."
        action={
          <Link href={buildMobileHomeHref()} className="app-button app-button-secondary">
            현장 목록으로 돌아가기
          </Link>
        }
      />
    );
  }

  const hasLoadedSessionPayload = Boolean(screen.sectionSession);
  const session = screen.sectionSession;
  const errors = [screen.uploadError, screen.syncError, screen.documentError].filter(
    (message): message is string => Boolean(message),
  );
  const mobileReportsHref = buildMobileSiteReportsHref(displaySession.siteKey);
  const saveStatusLabel = screen.isSaving
    ? '자동 저장 중'
    : hasLoadedSessionPayload
      ? '저장됨'
      : '본문 동기화 중';

  return (
    <MobileShell
      backHref={mobileReportsHref}
      backLabel="보고서 목록"
      currentUserName={screen.currentUserName}
      tabBar={<MobileTabBar tabs={buildSiteTabs(displaySession.siteKey)} />}
      onLogout={screen.logout}
      title={getSessionTitle(displaySession)}
      webHref={`/sessions/${encodeURIComponent(sessionId)}`}
      webLabel="웹에서 전체 편집"
    >
      <section className={styles.sectionCard} style={{ marginBottom: 0, borderRadius: '0 0 8px 8px', borderBottom: 'none' }}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleWrap}>
            <h2 className={styles.sectionTitle}>모바일 핵심 섹션 진행 현황</h2>
          </div>
          <span className={styles.sectionMeta}>{saveStatusLabel}</span>
        </div>

        <div className={styles.statGrid}>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>진행률</span>
            <strong className={styles.statValue}>{screen.displayProgress.percentage}%</strong>
          </article>
          <article className={styles.statCard}>
            <span className={styles.statLabel}>지도일</span>
            <strong className={styles.statValue}>
              {formatCompactDate(getSessionGuidanceDate(displaySession))}
            </strong>
          </article>
        </div>
      </section>

      {hasLoadedSessionPayload && session ? (
        <div className={tabStyles.layoutWrapper}>
          <div className={tabStyles.tabContainer}>
            {STEPS.map((step) => (
              <button
                key={step.id}
                type="button"
                className={`${tabStyles.tabButton} ${activeStep === step.id ? tabStyles.tabButtonActive : ''}`}
                onClick={() => setActiveStep(step.id)}
              >
                {step.label}
              </button>
            ))}
          </div>

          <div className={tabStyles.stepContent}>
            {/* 2단계: 기술지도 개요 */}
            {activeStep === 'step2' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>기술지도 개요</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>공정률 (%)</span>
                      <input
                        className="app-input"
                        type="number"
                        value={session.document2Overview.progressRate}
                        onChange={(e) => {
                          const value = e.target.value;
                          screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                            ...current,
                            document2Overview: {
                              ...current.document2Overview,
                              progressRate: value,
                            },
                          }));
                        }}
                        placeholder="0"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>담당자</span>
                      <input
                        className="app-input"
                        value={session.document2Overview.assignee}
                        onChange={(e) => {
                          const value = e.target.value;
                          screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                            ...current,
                            document2Overview: {
                              ...current.document2Overview,
                              assignee: value,
                            },
                          }));
                        }}
                        placeholder="담당자 이름"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>현장소장 (통지 대상자)</span>
                      <input
                        className="app-input"
                        value={session.document2Overview.notificationRecipientName}
                        onChange={(e) => {
                          const value = e.target.value;
                          screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                            ...current,
                            document2Overview: {
                              ...current.document2Overview,
                              notificationRecipientName: value,
                            },
                          }));
                        }}
                        placeholder="이름을 입력하세요"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>연락처</span>
                      <input
                        className="app-input"
                        value={session.document2Overview.contact}
                        onChange={(e) => {
                          const value = e.target.value;
                          screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                            ...current,
                            document2Overview: {
                              ...current.document2Overview,
                              contact: value,
                            },
                          }));
                        }}
                        placeholder="연락처를 입력하세요"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>통지 방법</span>
                      <select
                        className="app-select"
                        value={session.document2Overview.notificationMethod}
                        onChange={(e) => {
                          const value = e.target.value as 'direct' | 'registered_mail' | 'email' | 'mobile' | 'other';
                          screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                            ...current,
                            document2Overview: {
                              ...current.document2Overview,
                              notificationMethod: value,
                            },
                          }));
                        }}
                      >
                        <option value="direct">직접전달</option>
                        <option value="registered_mail">등기우편</option>
                        <option value="email">전자우편</option>
                        <option value="mobile">모바일</option>
                        <option value="other">기타</option>
                      </select>
                    </label>
                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                      <SignaturePad
                        label="현장소장 서명"
                        value={session.document2Overview.notificationRecipientSignature}
                        onChange={(value) => {
                          screen.applyDocumentUpdate('doc2', 'manual', (current) => ({
                            ...current,
                            document2Overview: {
                              ...current.document2Overview,
                              notificationRecipientSignature: value,
                            },
                          }));
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 3단계: 현장 전경 */}
            {activeStep === 'step3' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>현장 전경 및 진행공정</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document3Scenes.map((scene, index) => (
                      <article key={scene.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{scene.title || `현장 전경 ${index + 1}`}</span>
                          <button
                            type="button"
                            style={{ color: '#ef4444', fontSize: '13px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
                                ...current,
                                document3Scenes: current.document3Scenes.filter((s) => s.id !== scene.id),
                              }));
                            }}
                          >
                            삭제
                          </button>
                        </div>
                        <label style={{ display: 'block', width: '100%', height: '200px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer', marginBottom: '8px' }}>
                          {scene.photoUrl ? (
                            <img src={scene.photoUrl} alt="현장 사진" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '14px' }}>
                              터치하여 사진 선택
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                void screen.withFileData(file, (value) => {
                                  screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
                                    ...current,
                                    document3Scenes: current.document3Scenes.map((s) =>
                                      s.id === scene.id ? { ...s, photoUrl: value } : s
                                    ),
                                  }));
                                });
                              }
                            }}
                          />
                        </label>
                        <input
                          className="app-input"
                          value={scene.description}
                          onChange={(e) => {
                            const value = e.target.value;
                            screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
                              ...current,
                              document3Scenes: current.document3Scenes.map((s) =>
                                s.id === scene.id ? { ...s, description: value } : s
                              ),
                            }));
                          }}
                          placeholder="사진 설명 입력"
                          style={{ width: '100%' }}
                        />
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc3', 'manual', (current) => ({
                          ...current,
                          document3Scenes: [
                            ...current.document3Scenes,
                            {
                              id: `scene-${Date.now()}`,
                              title: `현장 전경 ${current.document3Scenes.length + 1}`,
                              photoUrl: '',
                              description: '',
                            },
                          ],
                        }));
                      }}
                    >
                      + 사진 추가
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 4단계: 이전 기술지도 사항 */}
            {activeStep === 'step4' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>이전 기술지도 사항 이행여부</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  {session.document4FollowUps.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {session.document4FollowUps.map((item) => (
                        <article key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>{item.location || '위치 미지정'}</div>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>이전 지적 사진</div>
                              {item.beforePhotoUrl ? (
                                <img src={item.beforePhotoUrl} alt="지적 사진" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '4px', backgroundColor: '#f8fafc' }} />
                              ) : (
                                <div style={{ width: '100%', height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94a3b8' }}>사진 없음</div>
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>개선 후 사진</div>
                              <label style={{ display: 'block', width: '100%', height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                                {item.afterPhotoUrl ? (
                                  <img src={item.afterPhotoUrl} alt="개선 사진" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                                    사진 선택
                                  </div>
                                )}
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      void screen.withFileData(file, (value) => {
                                        screen.applyDocumentUpdate('doc4', 'manual', (current) => ({
                                          ...current,
                                          document4FollowUps: current.document4FollowUps.map((f) =>
                                            f.id === item.id ? { ...f, afterPhotoUrl: value } : f
                                          ),
                                        }));
                                      });
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                          <input
                            className="app-input"
                            value={item.result}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc4', 'manual', (current) => ({
                                ...current,
                                document4FollowUps: current.document4FollowUps.map((f) =>
                                  f.id === item.id ? { ...f, result: value } : f
                                ),
                              }));
                            }}
                            placeholder="이행결과 (예: 개선완료)"
                            style={{ width: '100%', fontSize: '13px' }}
                          />
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.inlineNotice}>이전 기술지도 사항이 없습니다.</p>
                  )}
                </div>
              </section>
            )}

            {/* 6단계: 12대 사망사고 기인물 */}
            {activeStep === 'step6' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>12대 사망사고 기인물</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {session.document6Measures.map((measure) => (
                      <label key={measure.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={measure.checked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            screen.applyDocumentUpdate('doc6', 'manual', (current) => ({
                              ...current,
                              document6Measures: current.document6Measures.map((m) =>
                                m.key === measure.key ? { ...m, checked } : m
                              ),
                            }));
                          }}
                          style={{ width: '20px', height: '20px', flexShrink: 0 }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>{measure.label}</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{measure.guidance}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* 7단계: 현존 유해·위험요인 세부 지적 */}
            {activeStep === 'step7' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>현존 유해·위험요인 세부 지적</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document7Findings.map((finding, index) => (
                      <article key={finding.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>지적 사항 {index + 1}</span>
                          <button
                            type="button"
                            style={{ color: '#ef4444', fontSize: '13px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                ...current,
                                document7Findings: current.document7Findings.filter((f) => f.id !== finding.id),
                              }));
                            }}
                          >
                            삭제
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            className="app-input"
                            value={finding.location}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                ...current,
                                document7Findings: current.document7Findings.map((f) =>
                                  f.id === finding.id ? { ...f, location: value } : f
                                ),
                              }));
                            }}
                            placeholder="장소 (예: A동 2층)"
                            style={{ width: '100%' }}
                          />
                          <textarea
                            className="app-input"
                            value={finding.hazardDescription || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                ...current,
                                document7Findings: current.document7Findings.map((f) =>
                                  f.id === finding.id ? { ...f, hazardDescription: value } : f
                                ),
                              }));
                            }}
                            placeholder="유해·위험요인 설명"
                            style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <label style={{ flex: 1, height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                              {finding.photoUrl ? (
                                <img src={finding.photoUrl} alt="지적 사진 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                                  사진 1 추가
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void screen.withFileData(file, (value) => {
                                      screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                        ...current,
                                        document7Findings: current.document7Findings.map((f) =>
                                          f.id === finding.id ? { ...f, photoUrl: value } : f
                                        ),
                                      }));
                                    });
                                  }
                                }}
                              />
                            </label>
                            <label style={{ flex: 1, height: '120px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                              {finding.photoUrl2 ? (
                                <img src={finding.photoUrl2} alt="지적 사진 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '12px' }}>
                                  사진 2 추가
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    void screen.withFileData(file, (value) => {
                                      screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                                        ...current,
                                        document7Findings: current.document7Findings.map((f) =>
                                          f.id === finding.id ? { ...f, photoUrl2: value } : f
                                        ),
                                      }));
                                    });
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc7', 'manual', (current) => ({
                          ...current,
                          document7Findings: [
                            ...current.document7Findings,
                            {
                              id: `finding-${Date.now()}`,
                              photoUrl: '',
                              photoUrl2: '',
                              location: '',
                              hazardDescription: '',
                              likelihood: '3',
                              severity: '3',
                              riskLevel: '9',
                              accidentType: '기타',
                              causativeAgentKey: '',
                              inspector: '',
                              emphasis: '통상',
                              improvementPlan: '',
                              legalReferenceId: '',
                              legalReferenceTitle: '',
                              referenceMaterial1: '',
                              referenceMaterial2: '',
                              referenceCatalogAccidentType: '',
                              referenceCatalogCausativeAgentKey: '',
                              carryForward: false,
                            }
                          ],
                        }));
                      }}
                    >
                      + 지적 사항 추가
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 8단계: 향후 진행공정 */}
            {activeStep === 'step8' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>향후 진행공정 위험요인</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document8Plans.map((plan, index) => (
                      <article key={plan.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>진행공정 {index + 1}</span>
                          <button
                            type="button"
                            style={{ color: '#ef4444', fontSize: '13px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                ...current,
                                document8Plans: current.document8Plans.filter((p) => p.id !== plan.id),
                              }));
                            }}
                          >
                            삭제
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            className="app-input"
                            value={plan.processName}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                ...current,
                                document8Plans: current.document8Plans.map((p) =>
                                  p.id === plan.id ? { ...p, processName: value } : p
                                ),
                              }));
                            }}
                            placeholder="공정명 (예: 철골 자재 반입)"
                            style={{ width: '100%' }}
                          />
                          <textarea
                            className="app-input"
                            value={plan.hazard}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                ...current,
                                document8Plans: current.document8Plans.map((p) =>
                                  p.id === plan.id ? { ...p, hazard: value } : p
                                ),
                              }));
                            }}
                            placeholder="위험요인"
                            style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                          />
                          <textarea
                            className="app-input"
                            value={plan.countermeasure}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                                ...current,
                                document8Plans: current.document8Plans.map((p) =>
                                  p.id === plan.id ? { ...p, countermeasure: value } : p
                                ),
                              }));
                            }}
                            placeholder="안전대책"
                            style={{ width: '100%', minHeight: '60px', resize: 'vertical' }}
                          />
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc8', 'manual', (current) => ({
                          ...current,
                          document8Plans: [
                            ...current.document8Plans,
                            {
                              id: `plan-${Date.now()}`,
                              processName: '',
                              hazard: '',
                              countermeasure: '',
                              note: '',
                              source: 'manual',
                            }
                          ],
                        }));
                      }}
                    >
                      + 공정 추가
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 9단계: 위험성평가 / TBM */}
            {activeStep === 'step9' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>위험성평가 / TBM</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* TBM */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>TBM 체크리스트</div>
                      {session.document9SafetyChecks.tbm.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                          <span style={{ fontSize: '13px', flex: 1, paddingRight: '8px' }}>{item.prompt}</span>
                          <select
                            className="app-select"
                            value={item.rating}
                            onChange={(e) => {
                              const rating = e.target.value as 'good' | 'average' | 'poor' | '';
                              screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                ...current,
                                document9SafetyChecks: {
                                  ...current.document9SafetyChecks,
                                  tbm: current.document9SafetyChecks.tbm.map((q) =>
                                    q.id === item.id ? { ...q, rating } : q
                                  ),
                                },
                              }));
                            }}
                            style={{ width: '80px', padding: '4px 8px', fontSize: '13px', height: '32px' }}
                          >
                            <option value="">선택</option>
                            <option value="good">양호</option>
                            <option value="poor">불량</option>
                            <option value="average">보통</option>
                          </select>
                        </div>
                      ))}
                    </div>

                    {/* 위험성평가 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', paddingBottom: '4px', borderBottom: '1px solid #e2e8f0' }}>위험성평가 체크리스트</div>
                      {session.document9SafetyChecks.riskAssessment.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                          <span style={{ fontSize: '13px', flex: 1, paddingRight: '8px' }}>{item.prompt}</span>
                          <select
                            className="app-select"
                            value={item.rating}
                            onChange={(e) => {
                              const rating = e.target.value as 'good' | 'average' | 'poor' | '';
                              screen.applyDocumentUpdate('doc9', 'manual', (current) => ({
                                ...current,
                                document9SafetyChecks: {
                                  ...current.document9SafetyChecks,
                                  riskAssessment: current.document9SafetyChecks.riskAssessment.map((q) =>
                                    q.id === item.id ? { ...q, rating } : q
                                  ),
                                },
                              }));
                            }}
                            style={{ width: '80px', padding: '4px 8px', fontSize: '13px', height: '32px' }}
                          >
                            <option value="">선택</option>
                            <option value="good">양호</option>
                            <option value="poor">불량</option>
                            <option value="average">보통</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 10단계: 계측점검 */}
            {activeStep === 'step10' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>계측점검</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document10Measurements.map((measurement, index) => (
                      <article key={measurement.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>계측기 {index + 1}</span>
                          <button
                            type="button"
                            style={{ color: '#ef4444', fontSize: '13px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                ...current,
                                document10Measurements: current.document10Measurements.filter((m) => m.id !== measurement.id),
                              }));
                            }}
                          >
                            삭제
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              className="app-input"
                              value={measurement.instrumentType}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                  ...current,
                                  document10Measurements: current.document10Measurements.map((m) =>
                                    m.id === measurement.id ? { ...m, instrumentType: value } : m
                                  ),
                                }));
                              }}
                              placeholder="유형 (예: 조도계)"
                              style={{ flex: 1 }}
                            />
                            <input
                              className="app-input"
                              value={measurement.measuredValue}
                              onChange={(e) => {
                                const value = e.target.value;
                                screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                  ...current,
                                  document10Measurements: current.document10Measurements.map((m) =>
                                    m.id === measurement.id ? { ...m, measuredValue: value } : m
                                  ),
                                }));
                              }}
                              placeholder="측정값"
                              style={{ flex: 1 }}
                            />
                          </div>
                          <input
                            className="app-input"
                            value={measurement.measurementLocation}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                ...current,
                                document10Measurements: current.document10Measurements.map((m) =>
                                  m.id === measurement.id ? { ...m, measurementLocation: value } : m
                                ),
                              }));
                            }}
                            placeholder="측정 위치"
                            style={{ width: '100%' }}
                          />
                          <label style={{ display: 'block', width: '100%', height: '160px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                            {measurement.photoUrl ? (
                              <img src={measurement.photoUrl} alt="계측 사진" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                                사진 업로드
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void screen.withFileData(file, (value) => {
                                    screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                                      ...current,
                                      document10Measurements: current.document10Measurements.map((m) =>
                                        m.id === measurement.id ? { ...m, photoUrl: value } : m
                                      ),
                                    }));
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc10', 'manual', (current) => ({
                          ...current,
                          document10Measurements: [
                            ...current.document10Measurements,
                            {
                              id: `measure-${Date.now()}`,
                              instrumentType: '',
                              measurementLocation: '',
                              photoUrl: '',
                              measuredValue: '',
                              safetyCriteria: '',
                              actionTaken: '',
                            }
                          ],
                        }));
                      }}
                    >
                      + 계측점검 추가
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* 11단계: 안전교육 */}
            {activeStep === 'step11' && session.document11EducationRecords && session.document11EducationRecords[0] && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>안전교육</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>교육 주제</span>
                      <input
                        className="app-input"
                        value={session.document11EducationRecords[0].topic}
                        onChange={(e) => {
                          const value = e.target.value;
                          screen.applyDocumentUpdate('doc11', 'manual', (current) => {
                            const records = [...current.document11EducationRecords];
                            if (records[0]) {
                              records[0] = { ...records[0], topic: value };
                            }
                            return { ...current, document11EducationRecords: records };
                          });
                        }}
                        placeholder="예: 동절기 화재예방 교육"
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>참석 인원 (명)</span>
                      <input
                        className="app-input"
                        type="number"
                        value={session.document11EducationRecords[0].attendeeCount}
                        onChange={(e) => {
                          const value = e.target.value;
                          screen.applyDocumentUpdate('doc11', 'manual', (current) => {
                            const records = [...current.document11EducationRecords];
                            if (records[0]) {
                              records[0] = { ...records[0], attendeeCount: value };
                            }
                            return { ...current, document11EducationRecords: records };
                          });
                        }}
                        placeholder="0"
                      />
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>교육 현장 사진</span>
                      <label style={{ display: 'block', width: '100%', height: '160px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                        {session.document11EducationRecords[0].photoUrl ? (
                          <img src={session.document11EducationRecords[0].photoUrl} alt="안전교육 사진" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                            사진 업로드
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              void screen.withFileData(file, (value) => {
                                screen.applyDocumentUpdate('doc11', 'manual', (current) => {
                                  const records = [...current.document11EducationRecords];
                                  if (records[0]) {
                                    records[0] = { ...records[0], photoUrl: value };
                                  }
                                  return { ...current, document11EducationRecords: records };
                                });
                              });
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 12단계: 활동 실적 */}
            {activeStep === 'step12' && (
              <section style={{ padding: '16px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionTitleWrap}>
                    <h2 className={styles.sectionTitle}>활동 실적</h2>
                  </div>
                </div>
                <div className={styles.editorBody}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {session.document12Activities.map((activity, index) => (
                      <article key={activity.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600 }}>활동 실적 {index + 1}</span>
                          <button
                            type="button"
                            style={{ color: '#ef4444', fontSize: '13px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                            onClick={() => {
                              screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                ...current,
                                document12Activities: current.document12Activities.filter((a) => a.id !== activity.id),
                              }));
                            }}
                          >
                            삭제
                          </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <input
                            className="app-input"
                            value={activity.activityType}
                            onChange={(e) => {
                              const value = e.target.value;
                              screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                ...current,
                                document12Activities: current.document12Activities.map((a) =>
                                  a.id === activity.id ? { ...a, activityType: value } : a
                                ),
                              }));
                            }}
                            placeholder="활동 종류 (예: 안전점검 보조)"
                            style={{ width: '100%' }}
                          />
                          <label style={{ display: 'block', width: '100%', height: '160px', backgroundColor: '#f8fafc', border: '1px solid rgba(215, 224, 235, 0.88)', borderRadius: '4px', overflow: 'hidden', position: 'relative', cursor: 'pointer' }}>
                            {activity.photoUrl ? (
                              <img src={activity.photoUrl} alt="활동 사진" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '13px' }}>
                                사진 업로드
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  void screen.withFileData(file, (value) => {
                                    screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                                      ...current,
                                      document12Activities: current.document12Activities.map((a) =>
                                        a.id === activity.id ? { ...a, photoUrl: value } : a
                                      ),
                                    }));
                                  });
                                }
                              }}
                            />
                          </label>
                        </div>
                      </article>
                    ))}
                    <button
                      type="button"
                      className="app-button app-button-secondary"
                      style={{ width: '100%' }}
                      onClick={() => {
                        screen.applyDocumentUpdate('doc12', 'manual', (current) => ({
                          ...current,
                          document12Activities: [
                            ...current.document12Activities,
                            {
                              id: `activity-${Date.now()}`,
                              activityType: '',
                              content: '',
                              photoUrl: '',
                              photoUrl2: '',
                            }
                          ],
                        }));
                      }}
                    >
                      + 활동 실적 추가
                    </button>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      ) : (
        <p className={styles.inlineNotice} style={{ margin: '16px' }}>보고서 본문을 동기화하는 중입니다.</p>
      )}

      {errors.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          {errors.map((message) => (
            <p key={message} className={styles.errorNotice}>
              {message}
            </p>
          ))}
        </div>
      )}
    </MobileShell>
  );
}
