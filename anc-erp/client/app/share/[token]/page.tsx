import { PublicShareView } from "../../../components/public-share-view";
import { loadPublicSharePageData } from "../../../lib/webhard-page-data";

type PublicSharePageProps = {
  params: Promise<{ token: string }>;
};

export default async function PublicSharePage({ params }: PublicSharePageProps) {
  const { token } = await params;
  const pageData = await loadPublicSharePageData(token);

  return <PublicShareView detail={pageData.detail} />;
}
