export interface HazardReportItem {
  /** 유해·위험장소 */
  location: string;
  /** 유해·위험장소 데이터 */
  locationDetail: string;
  /** 위험성 평가 결과 데이터 */
  riskAssessmentResult: string;
  /** 유해·위험요인 데이터 */
  hazardFactors: string;
  /** 지적사항(재해예방 대책) 데이터 */
  improvementItems: string;
  /** 사진 데이터 (이미지 URL 또는 base64) */
  photoUrl: string;
  /** 법률 데이터 (관련 법규 등) */
  legalInfo: string;
  /** 이행시기 데이터 */
  implementationPeriod: string;
  /** metadata (API 원본 보관) */
  metadata?: string;
  /** objects (API 원본 보관) */
  objects?: string[];
}
