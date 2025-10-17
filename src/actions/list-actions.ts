'use server';

import { nanoid } from 'nanoid';
import { cookies } from 'next/headers';
import { getList, saveList, addUserToList } from '@/lib/db';
import type { TopTenList, User, Item, Rating, Criterion } from '@/types';

const COOKIE_PREFIX = 'topten_user_';

// Helper to get user identity from cookie for a specific list
async function getUserIdentity(listId: string): Promise<{ userId: string; displayName: string } | null> {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get(`${COOKIE_PREFIX}${listId}`);
  
  if (userCookie) {
    try {
      return JSON.parse(userCookie.value);
    } catch {
      return null;
    }
  }
  return null;
}

// Helper to set user identity cookie
async function setUserIdentity(listId: string, userId: string, displayName: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`${COOKIE_PREFIX}${listId}`, JSON.stringify({ userId, displayName }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
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
    const listId = nanoid(12);
    const ownerId = nanoid(12);
    const ownerToken = nanoid(32);

    const criteriaObjects: Criterion[] = criteria.map(name => ({
      id: nanoid(8),
      name,
    }));

    const newList: TopTenList = {
      id: listId,
      name,
      criteria: criteriaObjects,
      items: [],
      users: [],
      ownerId,
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

export async function joinList(listId: string, displayName: string): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    // Check if user already has identity for this list
    const existingIdentity = await getUserIdentity(listId);
    if (existingIdentity) {
      return { success: true, userId: existingIdentity.userId };
    }

    const userId = nanoid(12);
    const newUser: User = {
      id: userId,
      displayName,
      joinedAt: Date.now(),
    };

    list.users.push(newUser);
    await saveList(list);
    await setUserIdentity(listId, userId, displayName);

    // Track this list for the user
    await addUserToList(userId, listId);

    return { success: true, userId };
  } catch (error) {
    console.error('Error joining list:', error);
    return { success: false, error: 'Failed to join list' };
  }
}

export async function addItem(listId: string, itemName: string): Promise<{ success: boolean; itemId?: string; error?: string }> {
  try {
    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    const userIdentity = await getUserIdentity(listId);
    if (!userIdentity) {
      return { success: false, error: 'User not found. Please join the list first.' };
    }

    const newItem: Item = {
      id: nanoid(12),
      name: itemName,
      addedBy: userIdentity.userId,
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
    const list = await getList(listId);
    if (!list) {
      return { success: false, error: 'List not found' };
    }

    const userIdentity = await getUserIdentity(listId);
    if (!userIdentity) {
      return { success: false, error: 'User not found. Please join the list first.' };
    }

    const item = list.items.find(i => i.id === itemId);
    if (!item) {
      return { success: false, error: 'Item not found' };
    }

    // Remove existing rating for this user/criterion if exists
    item.ratings = item.ratings.filter(
      r => !(r.userId === userIdentity.userId && r.criterionId === criterionId)
    );

    // Add new rating
    const newRating: Rating = {
      userId: userIdentity.userId,
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
  userIdentity: { userId: string; displayName: string } | null; 
  isOwner: boolean;
}> {
  const list = await getList(listId);
  const userIdentity = await getUserIdentity(listId);
  const ownerToken = await getOwnerToken(listId);
  const isOwner = list ? (ownerToken === list.ownerToken) : false;

  return { list, userIdentity, isOwner };
}

export async function getUserListIds(): Promise<string[]> {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  const listIds: string[] = [];
  
  for (const cookie of allCookies) {
    if (cookie.name.startsWith(COOKIE_PREFIX)) {
      const listId = cookie.name.replace(COOKIE_PREFIX, '');
      listIds.push(listId);
    }
  }
  
  return listIds;
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

