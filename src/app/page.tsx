import Link from "next/link";
import PrefetchSelLink from '@/components/prefetch-sel-link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

export default function Home() {
  return (
    <>
      <div className="p-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Home</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="content-area">
        <h1>spdw</h1>
        <br />
        <PrefetchSelLink href="/sel" className="spdw-link">sel</PrefetchSelLink>
      </div>
    </>
  );
}
