
import React, { useMemo, useState } from "react";

function computeLVR(targetPrice, deposit) {
  if (targetPrice === undefined || targetPrice === null || targetPrice <= 0) return undefined;
  if (deposit === undefined || deposit === null) return undefined;
  var loan = Math.max(targetPrice - deposit, 0);
  return Math.min(100, Math.round((loan / targetPrice) * 1000) / 10);
}

function buildSummary(parts) {
  return parts.join("\n");
}

function runSelfTests() {
  var results = [];
  var s1 = buildSummary(["A", "B"]);
  results.push({ name: "join uses \\n", pass: s1 === "A\nB", info: s1 });
  results.push({ name: "LVR 800k/160k = 80%", pass: computeLVR(800000,160000) === 80, info: String(computeLVR(800000,160000)) });
  results.push({ name: "LVR 800k/80k = 90%", pass: computeLVR(800000,80000) === 90, info: String(computeLVR(800000,80000)) });
  results.push({ name: "buildSummary([]) -> ''", pass: buildSummary([]) === "", info: buildSummary([]) });
  results.push({ name: "computeLVR deposit=0 -> 100%", pass: computeLVR(500000,0) === 100, info: String(computeLVR(500000,0)) });
  results.push({ name: "computeLVR rounding 500k/100k -> 80.0", pass: computeLVR(500000,100000) === 80, info: String(computeLVR(500000,100000)) });
  results.push({ name: "computeLVR deposit>price -> 0%", pass: computeLVR(500000,600000) === 0, info: String(computeLVR(500000,600000)) });
  results.push({ name: "buildSummary single element", pass: buildSummary(["Only"]) === "Only", info: buildSummary(["Only"]) });
  results.push({ name: "computeLVR targetPrice missing -> undefined", pass: typeof computeLVR(undefined,100000) === "undefined", info: String(computeLVR(undefined,100000)) });
  results.push({ name: "computeLVR targetPrice<=0 -> undefined", pass: typeof computeLVR(0,100000) === "undefined", info: String(computeLVR(0,100000)) });
  results.push({ name: "computeLVR deposit=null -> undefined", pass: typeof computeLVR(500000,null) === "undefined", info: String(computeLVR(500000,null)) });
  results.push({ name: "computeLVR deposit negative -> 100%", pass: computeLVR(500000,-1000) === 100, info: String(computeLVR(500000,-1000)) });
  results.push({ name: "summary test name contains \\n literal", pass: "join uses \\n".indexOf("\\n") !== -1, info: "ok" });
  return results;
}

function pillCls(active) {
  return "px-3 py-1 rounded-full border text-sm transition " + (active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-100 border-gray-300");
}

function Section(props) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-600">{props.title}</h3>
      {props.children}
    </div>
  );
}

export default function TaskDefinitionWizard() {
  const [purpose, setPurpose] = useState("");
  const [horizon, setHorizon] = useState("2-5年");
  const [school, setSchool] = useState("中");
  const [schoolName, setSchoolName] = useState("");
  const [commute, setCommute] = useState("20-40 分");
  const [deposit, setDeposit] = useState(undefined);
  const [monthly, setMonthly] = useState(undefined);
  const [buffer, setBuffer] = useState(12);
  const [status, setStatus] = useState("");
  const [visaSubtype, setVisaSubtype] = useState("");
  const [targetPrice, setTargetPrice] = useState(undefined);

  const PURPOSE = ["自住", "投資", "先自住3年後投資", "先投資3年後自住"];
  const HORIZON = ["<2年", "2-5年", "5-10年", ">10年"];
  const SCHOOL = ["高", "中", "低"];
  const COMMUTE = ["<20 分", "20-40 分", "40-60 分", "遠距/彈性"];
  const STATUS = ["公民", "PR", "臨簽", "外國人"];
  const VISA_SUBTYPES = ["工作簽", "TR"];

  const lvr = useMemo(() => computeLVR(targetPrice, deposit), [targetPrice, deposit]);
  const lmiLikely = useMemo(() => (lvr || 0) > 80, [lvr]);
  const invalidVisa = useMemo(() => status === "臨簽" && !visaSubtype, [status, visaSubtype]);

  function formatNum(n) {
    if (typeof n === "undefined" || Number.isNaN(n)) return "";
    return Number(n).toLocaleString("en-AU", { maximumFractionDigits: 0 });
  }

  const summary = useMemo(() => {
    const parts = [];
    if (purpose) parts.push("目的:" + purpose);
    if (horizon) parts.push("持有年期:" + horizon);
    if (school === "高") {
      const note = schoolName ? "（指定:" + schoolName + "）" : "（請填指定學校）";
      parts.push("學區優先:高" + note);
    } else {
      parts.push("學區優先:" + school);
    }
    parts.push("通勤容忍:" + commute);
    if (typeof deposit !== "undefined") parts.push("可動用頭期:$" + formatNum(deposit));
    if (typeof monthly !== "undefined") parts.push("可承受月付:約 $" + formatNum(monthly) + "/月");
    parts.push("現金流安全墊:" + buffer + " 個月");
    if (status) {
      if (status === "臨簽") {
        const sub = visaSubtype ? "（" + visaSubtype + "）" : "（備註: 工作簽或TR）";
        parts.push("身分:臨簽" + sub);
      } else {
        parts.push("身分:" + status);
      }
    }
    if (typeof targetPrice !== "undefined") parts.push("目標房價:約 $" + formatNum(targetPrice));
    if (typeof lvr !== "undefined") parts.push("預估 LVR:約 " + lvr + "% " + (lmiLikely ? "(>80%, 可能需 LMI)" : "(<=80%, 通常免 LMI)"));
    return parts.join("\n");
  }, [purpose, horizon, school, schoolName, commute, deposit, monthly, buffer, status, visaSubtype, targetPrice, lvr, lmiLikely]);

  async function copySummary(){
    try {
      if (status === "臨簽" && !visaSubtype) {
        alert("請先選擇臨簽類型：工作簽或 TR");
        return;
      }
      await navigator.clipboard.writeText(summary || "");
      alert("已複製到剪貼簿");
    } catch(e) {
      console.error(e);
      alert("複製失敗，請手動選取文字複製");
    }
  }

  const tests = useMemo(runSelfTests, []);
  const testItems = tests.map((t, i) => {
    const cls = t.pass ? "text-emerald-700" : "text-rose-700";
    const label = "[" + (t.pass ? "PASS" : "FAIL") + "] " + t.name + " - " + String(t.info);
    return <li key={i} className={cls}>{label}</li>;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左側 */}
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold">澳洲買房 | 任務定義快速選單</h1>
          <p className="text-sm text-gray-600">點選下面的選項, 右側會即時產生摘要與 LVR/LMI 提示。</p>

          <Section title="1. 目的">
            <div className="flex flex-wrap gap-2">
              {PURPOSE.map((v) => (
                <button key={v} className={pillCls(purpose===v)} onClick={() => setPurpose(v)}>{v}</button>
              ))}
            </div>
          </Section>

          <Section title="2. 持有年期">
            <div className="flex flex-wrap gap-2">
              {HORIZON.map((v) => (
                <button key={v} className={pillCls(horizon===v)} onClick={() => setHorizon(v)}>{v}</button>
              ))}
            </div>
          </Section>

          <Section title="3. 學區優先級">
            <div className="flex flex-wrap gap-2">
              {SCHOOL.map((v) => (
                <button key={v} className={pillCls(school===v)} onClick={() => setSchool(v)}>{v}</button>
              ))}
            </div>
            {school === "高" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">指定學校名稱</label>
                  <input type="text" className="w-full rounded-xl border-gray-300 focus:ring-0" placeholder="例如: Balwyn High School" value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                </div>
                <div className="text-xs text-gray-500 flex items-end">備註: 學區優先=高時, 請填指定的學校名稱</div>
              </div>
            ) : null}
          </Section>

          <Section title="4. 通勤容忍">
            <div className="flex flex-wrap gap-2">
              {COMMUTE.map((v) => (
                <button key={v} className={pillCls(commute===v)} onClick={() => setCommute(v)}>{v}</button>
              ))}
            </div>
          </Section>

          <Section title="5. 預算邊界">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">可動用頭期 (AUD)</label>
                <input type="number" className="w-full rounded-xl border-gray-300 focus:ring-0" placeholder="例如 160000" value={deposit ?? ""} onChange={(e) => setDeposit(e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">可承受月付 (AUD/月)</label>
                <input type="number" className="w-full rounded-xl border-gray-300 focus:ring-0" placeholder="例如 3800" value={monthly ?? ""} onChange={(e) => setMonthly(e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">安全墊 (月數)</label>
                <div className="flex gap-2">
                  {[6,9,12,18].map((v) => (
                    <button key={v} className={pillCls(buffer===v)} onClick={() => setBuffer(v)}>{String(v)}</button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section title="6. 身分">
            <div className="flex flex-wrap gap-2">
              {STATUS.map((v) => (
                <button key={v} className={pillCls(status===v)} onClick={() => { setStatus(v); if (v!=="臨簽") setVisaSubtype(""); }}>{v}</button>
              ))}
            </div>
            {status === "臨簽" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">臨簽類型 (擇一)</label>
                  <div className="flex flex-wrap gap-2">
                    {VISA_SUBTYPES.map((v) => (
                      <button key={v} className={pillCls(visaSubtype===v)} onClick={() => setVisaSubtype(v)}>{v}</button>
                    ))}
                  </div>
                  {!visaSubtype ? <div className="text-xs text-rose-600 mt-1">請先選擇臨簽類型（工作簽或 TR）</div> : null}
                </div>
                <div className="text-xs text-gray-500 flex items-end">備註: 臨時簽證請標註 "工作簽" 或 "TR"</div>
              </div>
            ) : null}
          </Section>

          <Section title="7. 目標房價與 LVR 提示 (選填)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">目標房價 (AUD)</label>
                <input type="number" className="w-full rounded-xl border-gray-300 focus:ring-0" placeholder="例如 800000" value={targetPrice ?? ""} onChange={(e) => setTargetPrice(e.target.value ? Number(e.target.value) : undefined)} />
              </div>
              <div className="text-sm text-gray-600 flex items-end">
                {typeof lvr !== "undefined" ? (
                  <div>
                    預估 LVR: <span className="font-medium">{lvr}%</span> {lmiLikely ? <span className="ml-1 text-rose-600">(&gt;80%, 可能需 LMI)</span> : <span className="ml-1 text-emerald-600">(&lt;=80%, 通常免 LMI)</span>}
                  </div>
                ) : (
                  <div className="text-gray-400">輸入目標房價與頭期以試算 LVR 與 LMI 提示</div>
                )}
              </div>
            </div>
          </Section>
        </div>

        {/* 右側 */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow p-5">
            <h2 className="text-lg font-semibold mb-2">任務定義摘要</h2>
            <pre className="whitespace-pre-wrap text-sm leading-6 text-gray-800 bg-gray-50 rounded-xl p-4 border border-gray-100 min-h-[220px]">{summary || "尚未選擇, 請從左側開始點選。"}</pre>
            <div className="flex items-center gap-3 mt-3">
              <button onClick={copySummary} disabled={invalidVisa} className={"px-4 py-2 rounded-xl text-sm " + (invalidVisa ? "bg-gray-300 text-white cursor-not-allowed opacity-60" : "bg-black text-white hover:bg-gray-900")}>複製摘要</button>
              <span className="text-xs text-gray-500">複製後可貼到聊天、Email 或備忘錄</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-base font-semibold mb-2">名詞解釋：LVR 與 LMI</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-2">
              <li><span className="font-medium">LVR (Loan-to-Value Ratio, 貸款成數)</span> = 貸款金額 / 物件價值 x 100%, 以銀行估價與合約價取低者; 常見門檻 80%.</li>
              <li><span className="font-medium">LMI (Lender's Mortgage Insurance, 貸款抵押保險)</span>: LVR 大於 80% 時常需購買, 用於保護銀行; 保費可一次付或資本化併入貸款.</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-base font-semibold mb-2">內建自動測試 (開發者可見)</h3>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              {testItems}
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <h3 className="text-base font-semibold mb-2">下一步建議</h3>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-1">
              <li>把上方摘要複製並與貸款經紀核對(預批、利率、是否觸發 LMI)。</li>
              <li>依學區/通勤與預算縮圈 2-3 個郊區, 建立 Top 10 看房清單。</li>
              <li>簽約前務必審閱 Section 32 與政府 Due Diligence Checklist。</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
