type OwnerReportBranchNoticeProps = {
  ownerDisplayName: string;
  ownerPartyId: string;
};

export function OwnerReportBranchNotice({
  ownerDisplayName,
  ownerPartyId,
}: OwnerReportBranchNoticeProps) {
  return (
    <section className="card">
      <p className="card-eyebrow">Owner Branch</p>
      <h3>{ownerDisplayName}</h3>
      <p className="card-copy">
        이 문서는 발주처 분기 기준으로 생성되며, `ownerPartyId`는 `{ownerPartyId}`로 고정됩니다.
      </p>
    </section>
  );
}

