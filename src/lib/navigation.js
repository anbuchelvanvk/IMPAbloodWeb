'use client';

import NextLink from 'next/link';
import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function Link({ to, href, children, ...props }) {
  const target = to || href || '/';
  return <NextLink href={target} {...props}>{children}</NextLink>;
}

export function useNavigate() {
  const router = useRouter();
  return useCallback((to) => router.push(to), [router]);
}

export function useLocation() {
  const pathname = usePathname();
  const search = useSearchParams();
  return {
    pathname,
    search: search.toString() ? `?${search.toString()}` : '',
    state: null
  };
}
