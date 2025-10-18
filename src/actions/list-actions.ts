'use server';

import { nanoid } from 'nanoid';
import { auth, currentUser } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { getList, saveList, getAllListIds } from '@/lib/db';
import type { TopTenList, User, Item, Rating, Criterion, UserIdentity } from '@/types';

// Helper to get current Clerk user
async function getCurrentUserIdentity(): Promise<UserIdentity | null> {
  const user = await currentUser();
  
  if (!user) return null;
  
  return {
    userId: user.id,
    displayName: user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.username || user.emailAddresses[0]?.emailAddress || 'User',
    email: user.emailAddresses[0]?.emailAddress,
    imageUrl: user.imageUrl,
  };
}

// Helper to get owner token from cookie
async function getOwnerToken(listId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const ownerCookie = cookieStore.get(`topten_owner_${listId}`);
  return ownerCookie?.value || null;
}

// Helper to verify owner
async function verifyOwner(listId: string, ownerToken: string): Promise<boolean> {
  const storedToken = await getOwnerToken(listId);
  return storedToken === ownerToken;
}

export async function createList(name: string, criteria: string[]): Promise<{ success: boolean; listId?: string; error?: string }> {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return { success: false, error: 'You must be signed in to create a list' };
    }

    const userIdentity = await getCurrentUserIdentity();
    if (!userIdentity) {
      return { success: false, error: 'Could not get user information' };
    }

    const listId = nanoid(12);
    const ownerToken = nanoid(32);

    const criteriaObjects: Criterion[] = criteria.map(name => ({
      id: nanoid(8),
      name,
    }));

    // Add creator as the first user
    const creatorUser: User = {
      id: clerkUserId,
      displayName: userIdentity.displayName,
      joinedAt: Date.now(),
      email: userIdentity.email,
      imageUrl: userIdentity.imageUrl,
    };

    const newList: TopTenList = {
      id: listId,
      name,
      criteria: criteriaObjects,
      items: [],
      users: [creatorUser], // Add creator as first user
      ownerId: clerkUserId, // Use Clerk user ID as owner
      ownerToken,
      createdAt: Date.now(),
      isLocked: false,
    };

    await saveList(newList);

    // Set owner cookie
    const cookieStore = await cookies();
    cookieStore.set(`topten_owner_${listId}`, ownerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return { success: true, listId };
  } catch (error) {
    console.error('Error creating list:', error);
    return { success: false, error: 'Failed to create list' };
  }
}

export async function joinList(listId: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return { success: false, error: 'You must be signed in to join a list' };
    }

    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    const userIdentity = await getCurrentUserIdentity();
    if (!userIdentity) {
      return { success: false, error: 'Could not get user information' };
    }

    // Check if user already in this list
    const existingUser = list.users.find(u => u.id === clerkUserId);
    if (existingUser) {
      return { success: true, userId: clerkUserId };
    }

    // Add user to list
    const newUser: User = {
      id: clerkUserId,
      displayName: userIdentity.displayName,
      joinedAt: Date.now(),
      email: userIdentity.email,
      imageUrl: userIdentity.imageUrl,
    };

    list.users.push(newUser);
    await saveList(list);

    return { success: true, userId: clerkUserId };
  } catch (error) {
    console.error('Error joining list:', error);
    return { success: false, error: 'Failed to join list' };
  }
}

export async function addItem(listId: string, itemName: string): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return { success: false, error: 'You must be signed in to add items' };
    }

    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    // Check if user is a member of this list
    const isMember = list.users.some(u => u.id === clerkUserId);
    if (!isMember) {
      return { success: false, error: 'Please join the list first.' };
    }

    const newItem: Item = {
      id: nanoid(12),
      name: itemName,
      addedBy: clerkUserId,
      addedAt: Date.now(),
      ratings: [],
    };

    list.items.push(newItem);
    await saveList(list);

    return { success: true, itemId: newItem.id };
  } catch (error) {
    console.error('Error adding item:', error);
    return { success: false, error: 'Failed to add item' };
  }
}

export async function rateItem(listId: string, itemId: string, criterionId: string, value: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return { success: false, error: 'You must be signed in to rate items' };
    }

    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    // Check if user is a member of this list
    const isMember = list.users.some(u => u.id === clerkUserId);
    if (!isMember) {
      return { success: false, error: 'Please join the list first.' };
    }

    const item = list.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Remove existing rating for this user/criterion if exists
    item.ratings = item.ratings.filter(
      r => !(r.userId === clerkUserId && r.criterionId === criterionId)
    );

    // Add new rating
    const newRating: Rating = {
      userId: clerkUserId,
      criterionId,
      value,
    };
    item.ratings.push(newRating);

    await saveList(list);

    return { success: true };
  } catch (error) {
    console.error('Error rating item:', error);
    return { success: false, error: 'Failed to rate item' };
  }
}

export async function removeItem(listId: string, itemId: string, ownerToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!await verifyOwner(listId, ownerToken)) {
      return { success: false, error: 'Unauthorized' };
    }

    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    list.items = list.items.filter(i => i.id !== itemId);
    await saveList(list);

    return { success: true };
  } catch (error) {
    console.error('Error removing item:', error);
    return { success: false, error: 'Failed to remove item' };
  }
}

export async function toggleLockList(listId: string, ownerToken: string): Promise<{ success: boolean; isLocked?: boolean; error?: string }> {
  try {
    if (!await verifyOwner(listId, ownerToken)) {
      return { success: false, error: 'Unauthorized' };
    }

    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    list.isLocked = !list.isLocked;
    await saveList(list);

    return { success: true, isLocked: list.isLocked };
  } catch (error) {
    console.error('Error toggling lock:', error);
    return { success: false, error: 'Failed to toggle lock' };
  }
}

export async function getListWithUserContext(listId: string): Promise<{ 
  list: TopTenList | null; 
  userIdentity: UserIdentity | null; 
  isOwner: boolean;
}> {
  const list = await getList(listId);
  const userIdentity = await getCurrentUserIdentity();
  const ownerToken = await getOwnerToken(listId);
  const isOwner = list ? (ownerToken === list.ownerToken) : false;

  return { list, userIdentity, isOwner };
}

export async function getUserListIds(): Promise<string[]> {
  const { userId } = await auth();
  
  if (!userId) return [];
  
  // Get all list IDs and filter to ones where user is a member or owner
  const allListIds = await getAllListIds();
  const userListIds: string[] = [];
  
  for (const listId of allListIds) {
    const list = await getList(listId);
    if (list) {
      // Check if user is a member or owner
      const isMember = list.users.some(u => u.id === userId);
      const isOwner = list.ownerId === userId;
      
      if (isMember || isOwner) {
        userListIds.push(listId);
      }
    }
  }
  
  return userListIds;
}

export async function getUserListsSummary(): Promise<Array<{
  id: string;
  name: string;
  itemCount: number;
  memberCount: number;
  isOwner: boolean;
}>> {
  const listIds = await getUserListIds();
  
  const summaries = await Promise.all(
    listIds.map(async (listId) => {
      const { list, isOwner } = await getListWithUserContext(listId);
      
      if (!list) return null;
      
      return {
        id: list.id,
        name: list.name,
        itemCount: list.items.length,
        memberCount: list.users.length,
        isOwner,
      };
    })
  );
  
  return summaries.filter((summary): summary is NonNullable<typeof summary> => summary !== null);
}

export async function addCriterion(listId: string, criterionName: string, ownerToken: string): Promise<{ success: boolean; criterionId?: string; error?: string }> {
  try {
    if (!await verifyOwner(listId, ownerToken)) {
      return { success: false, error: 'Unauthorized' };
    }

    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    // Check if criterion with same name already exists
    if (list.criteria.some(c => c.name.toLowerCase() === criterionName.toLowerCase())) {
      return { success: false, error: 'A criterion with this name already exists' };
    }

    const newCriterion: Criterion = {
      id: nanoid(8),
      name: criterionName,
    };

    list.criteria.push(newCriterion);
    await saveList(list);

    return { success: true, criterionId: newCriterion.id };
  } catch (error) {
    console.error('Error adding criterion:', error);
    return { success: false, error: 'Failed to add criterion' };
  }
}

export async function removeCriterion(listId: string, criterionId: string, ownerToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!await verifyOwner(listId, ownerToken)) {
      return { success: false, error: 'Unauthorized' };
    }

    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    // Remove the criterion
    list.criteria = list.criteria.filter(c => c.id !== criterionId);

    // Clean up all ratings for this criterion from all items
    for (const item of list.items) {
      item.ratings = item.ratings.filter(r => r.criterionId !== criterionId);
    }

    await saveList(list);

    return { success: true };
  } catch (error) {
    console.error('Error removing criterion:', error);
    return { success: false, error: 'Failed to remove criterion' };
  }
}

