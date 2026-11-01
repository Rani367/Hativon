import { studioCopy } from "@/lib/studio-copy";

const { list: text } = studioCopy;

/** A plain GET form, so filters live in the URL and work without JavaScript. */
export function PostFilter({ search, status }: { search?: string; status?: string }) {
  return (
    <form className="filter" role="search">
      <input
        name="q"
        type="search"
        aria-label={text.search}
        placeholder={text.search}
        defaultValue={search}
      />
      <select name="status" aria-label={text.filter} defaultValue={status ?? ""}>
        <option value="">{text.all}</option>
        <option value="published">{text.published}</option>
        <option value="draft">{text.drafts}</option>
      </select>
      <button type="submit" className="button button-quiet">
        {text.filter}
      </button>
    </form>
  );
}
