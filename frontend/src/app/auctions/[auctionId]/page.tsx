import { AuctionDetail } from '../../../components/auction-detail/auction-detail';

interface AuctionDetailPageProps {
  params: Promise<{ auctionId: string }>;
}

export default async function AuctionDetailPage({
  params,
}: AuctionDetailPageProps) {
  const { auctionId } = await params;

  return <AuctionDetail auctionId={auctionId} />;
}
