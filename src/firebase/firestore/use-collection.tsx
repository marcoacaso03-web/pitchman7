"use client";

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { z } from 'zod';
import {
  Query,
  getDocs,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null; 
  isLoading: boolean;       
  error: FirestoreError | Error | null; 
}

export interface InternalQuery extends Query<DocumentData> {
  _query: {
    path: {
      canonicalString(): string;
      toString(): string;
    }
  }
}

export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
    schema?: z.ZodSchema<T>
): UseCollectionResult<T> {
  // Use a string key for SWR deduplication
  const swrKey = memoizedTargetRefOrQuery
    ? memoizedTargetRefOrQuery.type === 'collection'
      ? (memoizedTargetRefOrQuery as CollectionReference).path
      : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString()
    : null;

  const fetcher = async () => {
    if (!memoizedTargetRefOrQuery) return null;
    try {
      const snapshot = await getDocs(memoizedTargetRefOrQuery);
      return snapshot.docs.map(doc => {
        const rawData = { ...(doc.data() as T), id: doc.id };
        if (schema) {
          const parsed = schema.safeParse(rawData);
          if (parsed.success) return parsed.data as WithId<T>;
          console.error("Schema validation failed for collection item:", parsed.error, rawData);
        }
        return rawData as WithId<T>;
      });
    } catch (err: any) {
      const path = memoizedTargetRefOrQuery.type === 'collection'
            ? (memoizedTargetRefOrQuery as CollectionReference).path
            : (memoizedTargetRefOrQuery as unknown as InternalQuery)._query.path.canonicalString();

      const contextualError = new FirestorePermissionError({
        operation: 'list',
        path,
      });

      errorEmitter.emit('permission-error', contextualError);
      throw contextualError;
    }
  };

  const { data, error, isLoading } = useSWR(
    swrKey,
    fetcher,
    {
      revalidateOnFocus: false, // Prevents massive refetches when switching tabs
      dedupingInterval: 10000, // Cache for 10 seconds before allowing another identical read
    }
  );

  if (memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
     console.warn(memoizedTargetRefOrQuery + ' was not properly memoized using useMemoFirebase');
  }

  return {  
    data: data || null, 
    isLoading: isLoading && !data && !error, 
    error: error || null 
  };
}
