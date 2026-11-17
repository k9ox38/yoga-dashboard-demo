import { PackageEditor } from "../components/Packages";

export function PackageCreatePage() {
  return <PackageEditor />;
}

export function PackageEditPage() {
  return <PackageEditor />;
}

export function PackageViewPage() {
  return <PackageEditor readOnly />;
}
