import { ErpShell } from "../../../../components/erp-shell";
import { ContractFileList } from "../../../../components/contract-file-list";
import { ContractTabs } from "../../../../components/contract-tabs";
import { SignedFileUploader } from "../../../../components/signed-file-uploader";
import { loadContractDetailData } from "../../../../lib/contract-page-data";

type PageProps = {
  params: Promise<{ contractId: string }>;
};

export default async function ContractFilesPage({ params }: PageProps) {
  const { contractId } = await params;
  const pageData = await loadContractDetailData(contractId);

  return (
    <ErpShell title="계약 파일" subtitle="웹하드 00_계약_견적 폴더와 연결되는 파일 관리 화면입니다.">
      <ContractTabs active="파일" contractId={contractId} />
      <SignedFileUploader
        contractId={contractId}
        finalFileId={pageData.detail.contract.finalFileId}
        files={pageData.detail.files}
        signedFileId={pageData.detail.contract.signedFileId}
      />
      <ContractFileList files={pageData.detail.files} />
    </ErpShell>
  );
}
