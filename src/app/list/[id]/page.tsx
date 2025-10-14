import { notFound } from 'next/navigation';
import { getListWithUserContext } from '@/actions/list-actions';
import ListContent from './list-content';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListPage({ params }: PageProps) {
  const { id } = await params;
  const { list, userIdentity, isOwner } = await getListWithUserContext(id);

  if (!list) {
    notFound();
  }

  return (
    <ListContent 
      list={list} 
      userIdentity={userIdentity} 
      isOwner={isOwner}
    />
  );
}

