import React, { useEffect, useMemo, useState } from "react";
import styles from "./index.module.less";
import Demo from "./demo";
let mockMonth = 7;

export default () => {
  const [count, setCount] = useState(0);

  const jsx = useMemo(
    () => (
      <div>
        <input />
        {count}
      </div>
    ),
    [count]
  );

  return (
    <>
      <div className={styles.test}>
        <button onClick={(e) => setCount((v) => v + 1)}>setData</button>
      </div>
      {jsx}
      <Demo />
    </>
  );
};
