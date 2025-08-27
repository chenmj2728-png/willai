import React, { useMemo, useState } from 'react'

function Item({label, value}){
  return (
    <div style={{display:'flex', justifyContent:'space-between', gap:12, padding:'6px 0'}}>
      <span className="muted">{label}</span>
      <span style={{fontWeight:600}}>{value}</span>
    </div>
  )
}

const FHOG_VIC = 10000 // 新屋 FHOG
const LVR_BUFFER = 0.03 // 審核+3%緩衝（服務能力測試）

function calcPreApproval({
  grossAnnual, otherDebtMonthly, rate=0.068, termYears=30, buffer=LVR_BUFFER, hhm=0.30
}){
  const monthlyIncome = (grossAnnual||0)/12
  const maxRepayment = Math.max(0, monthlyIncome*hhm - (otherDebtMonthly||0))
  const testRate = rate + buffer
  const r = testRate/12
  const n = termYears*12
  const factor = (1 - Math.pow(1+r, -n))/r
  const loanCeil = Math.max(0, maxRepayment * factor)
  return { loanCeil, price80: loanCeil/0.8, price95: loanCeil/0.95 }
}

function CardPreApproval(){
  const [income, setIncome] = useState(150000)
  const [debts, setDebts] = useState(0)
  const [lvr, setLvr] = useState(0.80) // 0.80 or 0.95
  const [deposit, setDeposit] = useState(120000)

  const res = useMemo(()=>calcPreApproval({grossAnnual: income, otherDebtMonthly: debts}), [income, debts])
  const targetPrice = useMemo(()=> (lvr===0.8 ? res.price80 : res.price95), [res, lvr])
  const gap = Math.max(0, targetPrice - deposit/(1-lvr))

  return (
    <div className="card">
      <div className="pill">預批額度粗估（非正式）</div>
      <h2>銀行預批：可承作房價上限</h2>
      <p className="muted">以可服務本息能力、+3% 利率緩衝、30年期估算；實際以銀行審批為準。</p>

      <Item label="年總收入（AUD）" value={<input type="number" value={income} onChange={e=>setIncome(+e.target.value||0)} />} />
      <Item label="每月其他債務（AUD）" value={<input type="number" value={debts} onChange={e=>setDebts(+e.target.value||0)} />} />
      <Item label="LVR 假設" value={
        <select value={lvr} onChange={e=>setLvr(+e.target.value)}>
          <option value={0.8}>80%（免 LMI）</option>
          <option value={0.95}>95%（含 LMI，首購可用）</option>
        </select>
      } />
      <Item label="可用自備款（AUD）" value={<input type="number" value={deposit} onChange={e=>setDeposit(+e.target.value||0)} />} />

      <div style={{height:8}} />
      <details>
        <summary>估算結果</summary>
        <div style={{paddingTop:8}}>
          <Item label="貸款上限（估）" value={`$${res.loanCeil.toLocaleString()}`} />
          <Item label="房價上限（LVR 80%）" value={`$${Math.round(res.price80).toLocaleString()}`} />
          <Item label="房價上限（LVR 95%）" value={`$${Math.round(res.price95).toLocaleString()}`} />
          <div className="muted">＊LMI 的實際費用將壓縮可買價格，需以銀行試算為準。</div>
        </div>
      </details>

      <div style={{height:8}} />
      <details>
        <summary>我的自備款是否足夠？</summary>
        <div style={{paddingTop:8}}>
          <div className="muted">以所選 LVR 倒推全案所需自備款。</div>
          <Item label="對應房價上限" value={`$${Math.round(targetPrice).toLocaleString()}`} />
          <Item label="所需自備款（含印花/雜費另計）" value={`$${Math.round(targetPrice*(1-lvr)).toLocaleString()}`} />
          <Item label="目前自備款差額" value={gap === 0 ? <span className="ok">已足夠</span> : `$${Math.round(gap).toLocaleString()}`} />
        </div>
      </details>
    </div>
  )
}

function CardChecklist(){
  const [items, setItems] = useState({
    id:'checklist',
    list:[
      {k:'身份與簽證', ok:false},
      {k:'收入證明（近 3–6 個月薪資/稅單）', ok:false},
      {k:'存款證明（與來源說明）', ok:false},
      {k:'信用卡/貸款對帳單', ok:false},
      {k:'首購與印花稅優惠資格核對', ok:false},
      {k:'FIRB 是否需要（外籍/臨簽）', ok:false}
    ]
  })
  const toggle = i => {
    const next = {...items}
    next.list = next.list.map((x,idx)=> idx===i ? {...x, ok: !x.ok} : x)
    setItems(next)
  }
  const done = items.list.filter(x=>x.ok).length
  return (
    <div className="card">
      <div className="pill">清單</div>
      <h2>銀行預批｜文件準備打勾卡</h2>
      <ul className="check">
        {items.list.map((x,i)=>(
          <li key={i}>
            <input type="checkbox" checked={x.ok} onChange={()=>toggle(i)} />
            <span>{x.k}</span>
          </li>
        ))}
      </ul>
      <div className="muted">{done} / {items.list.length} 已完成</div>
    </div>
  )
}

function CardGlossary(){
  return (
    <div className="card">
      <div className="pill">名詞解釋</div>
      <h2>常見名詞（精簡版）</h2>
      <details open>
        <summary>LVR / LMI</summary>
        <p className="muted">
          <b>LVR</b>（Loan to Value Ratio）= 貸款 / 估價。80% 通常免 LMI；90–95% 需投保 <b>LMI</b>（Lenders Mortgage Insurance）。
        </p>
      </details>
      <div style={{height:8}}/>
      <details>
        <summary>Serviceability（服務能力）</summary>
        <p className="muted">銀行以利率 + <b>3%</b> 緩衝做壓力測試；你的收入需能承擔本息與現有負債。</p>
      </details>
      <div style={{height:8}}/>
      <details>
        <summary>FHOG（首購補助）與印花稅</summary>
        <p className="muted">維州新成屋符合條件可領 <b>${FHOG_VIC.toLocaleString()}</b>；印花稅首購自住有門檻減免，依 SRO 最新公告。</p>
      </details>
    </div>
  )
}

export default function App(){
  return (
    <>
      <header>
        <h1>WillDataAI • 澳洲買房任務精靈 v3</h1>
        <div className="muted">預批額度估算／文件清單／名詞解釋</div>
      </header>
      <div className="wrap">
        <div className="grid">
          <CardPreApproval/>
          <CardChecklist/>
          <CardGlossary/>
        </div>
        <div className="footer">
          Build: v3 • 本工具僅供教育參考，實際預批以銀行/經紀審核為準。
        </div>
      </div>
    </>
  )
}
