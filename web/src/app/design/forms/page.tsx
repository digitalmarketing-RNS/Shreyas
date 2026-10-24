import type { Metadata } from "next";
import {
  CodeBlockSpecimens,
  CopyButtonSpecimens,
  SecretRevealSpecimens,
} from "@/components/ui/forms/_gallery/copy-secret-specimens";
import {
  ConsentCaptureSpecimens,
  FieldSpecimens,
  FormLayoutSpecimens,
} from "@/components/ui/forms/_gallery/form-structure-specimens";
import {
  DatePickerSpecimens,
  DateRangePickerSpecimens,
  DateTimePickerSpecimens,
  FileUploadSpecimens,
  OtpInputSpecimens,
  PhoneInputSpecimens,
} from "@/components/ui/forms/_gallery/phone-date-file-specimens";
import {
  DisclosureSpecimens,
  KbdSpecimens,
  LinkSpecimens,
  SeparatorSpecimens,
} from "@/components/ui/forms/_gallery/primitive-specimens";
import {
  ChannelTabsSpecimens,
  SearchInputSpecimens,
  SegmentedControlSpecimens,
} from "@/components/ui/forms/_gallery/switcher-search-specimens";
import {
  CheckboxSpecimens,
  ComboboxSpecimens,
  NumberStepperSpecimens,
  RadioGroupSpecimens,
  SelectSpecimens,
  SwitchSpecimens,
  TextareaSpecimens,
  TextInputSpecimens,
} from "@/components/ui/forms/_gallery/text-choice-specimens";
import { GalleryPage } from "../_gallery";
import { ButtonSpecimens, IconButtonSpecimens } from "../_gallery/button-specimens";

export const metadata: Metadata = { title: "Forms" };

/** The group 1 sections of components.md, in order, for the page's contents list. */
const CONTENTS: Array<{ group: string; blocks: Array<[id: string, title: string]> }> = [
  { group: "Buttons", blocks: [["button", "Button"], ["icon-button", "IconButton"]] },
  {
    group: "Text and choice inputs",
    blocks: [
      ["text-input", "TextInput"],
      ["textarea", "Textarea"],
      ["select", "Select"],
      ["combobox", "Combobox"],
      ["checkbox", "Checkbox"],
      ["radio-group", "RadioGroup"],
      ["switch", "Switch"],
      ["number-stepper", "NumberStepper"],
    ],
  },
  {
    group: "Phone, code, date and file inputs",
    blocks: [
      ["phone-input", "PhoneInput"],
      ["otp-input", "OtpInput"],
      ["date-picker", "DatePicker"],
      ["date-time-picker", "DateTimePicker"],
      ["date-range-picker", "DateRangePicker"],
      ["file-upload", "FileUpload"],
    ],
  },
  {
    group: "Form structure and consent",
    blocks: [
      ["field", "Field"],
      ["form-layout", "FormLayout"],
      ["consent-capture", "ConsentCapture"],
    ],
  },
  {
    group: "Switchers and search",
    blocks: [
      ["segmented-control", "SegmentedControl"],
      ["channel-tabs", "ChannelTabs"],
      ["search-input", "SearchInput"],
    ],
  },
  {
    group: "Copy and secrets",
    blocks: [
      ["copy-button", "CopyButton"],
      ["code-block", "CodeBlock"],
      ["secret-reveal", "SecretReveal"],
    ],
  },
  {
    group: "Small primitives",
    blocks: [
      ["link", "Link"],
      ["kbd", "Kbd"],
      ["separator", "Separator"],
      ["disclosure", "Disclosure"],
    ],
  },
];

export default function Page() {
  return (
    <GalleryPage
      title="Forms"
      description="Buttons, form controls, the field wrapper, form layout, consent capture, copy and secret patterns, and the small primitives (components.md, group 1). Every variant, size and state is labelled; hover and focus are drawn with their classes where a still picture needs them, and most specimens are live, so their keyboard paths can be tried."
    >
      <nav aria-label="Components on this page" className="rounded-lg border border-border bg-surface p-4">
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {CONTENTS.map((section) => (
            <li key={section.group} className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted">{section.group}</span>
              <ul className="m-0 flex list-none flex-wrap gap-x-3 p-0">
                {section.blocks.map(([id, title]) => (
                  <li key={id}>
                    <a href={`#${id}`} className="inline-flex min-h-hit items-center rounded-xs text-sm text-accent underline underline-offset-2 hover:decoration-2">
                      {title}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </nav>

      <ButtonSpecimens />
      <IconButtonSpecimens />

      <TextInputSpecimens />
      <TextareaSpecimens />
      <SelectSpecimens />
      <ComboboxSpecimens />
      <CheckboxSpecimens />
      <RadioGroupSpecimens />
      <SwitchSpecimens />
      <NumberStepperSpecimens />

      <PhoneInputSpecimens />
      <OtpInputSpecimens />
      <DatePickerSpecimens />
      <DateTimePickerSpecimens />
      <DateRangePickerSpecimens />
      <FileUploadSpecimens />

      <FieldSpecimens />
      <FormLayoutSpecimens />
      <ConsentCaptureSpecimens />

      <SegmentedControlSpecimens />
      <ChannelTabsSpecimens />
      <SearchInputSpecimens />

      <CopyButtonSpecimens />
      <CodeBlockSpecimens />
      <SecretRevealSpecimens />

      <LinkSpecimens />
      <KbdSpecimens />
      <SeparatorSpecimens />
      <DisclosureSpecimens />
    </GalleryPage>
  );
}
