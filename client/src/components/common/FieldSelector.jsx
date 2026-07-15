// Suggested location: src/components/common/FieldSelector.jsx
// Adjust the "../../api/farmerService" import path below if placed elsewhere.
//
// Renders nothing when the farmer has 0 or 1 fields — dropdown only shows
// up once there's actually something to choose between. Reports the
// selected field_id (or null for "no field selected yet" while loading) to
// the parent via onChange.

import { useState, useEffect } from "react";
import "./css/FieldSelector.css";
import { getFields } from "../../api/farmerService";

function FieldSelector({ onChange }) {
  const [fields, setFields] = useState([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getFields();
        const list = res.data.data || [];
        setFields(list);
        if (list.length) {
          setSelected(String(list[0].field_id));
          onChange?.(list[0].field_id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    setSelected(value);
    onChange?.(Number(value));
  };

  // Nothing to choose between — the caller's default (single-field) view
  // just works, no dropdown clutters the page.
  if (loading || fields.length <= 1) return null;

  return (
    <div className="fieldSelector">
      <label htmlFor="fieldSelectorInput">Field:</label>
      <select id="fieldSelectorInput" value={selected} onChange={handleChange}>
        {fields.map((f) => (
          <option key={f.field_id} value={f.field_id}>
            {f.field_name} ({f.farm_name})
          </option>
        ))}
      </select>
    </div>
  );
}

export default FieldSelector;
