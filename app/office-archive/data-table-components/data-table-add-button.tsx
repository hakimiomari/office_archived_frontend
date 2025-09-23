import { Button } from "@/components/ui/button";
import { MixerHorizontalIcon } from "@radix-ui/react-icons";

export default function DataTableAddButton() {
  return (
    <Button variant="outline" size="sm" className="ml-auto  h-8 lg:flex">
      <MixerHorizontalIcon className="mr-2 h-4 w-4" />
      Add
    </Button>
  );
}
