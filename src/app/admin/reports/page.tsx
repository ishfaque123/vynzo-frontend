'use client';

import {useEffect,useMemo,useState} from 'react';
import {deleteAdminComment,deleteAdminReport,fetchAdminReports} from '@/lib/api/adminApi';

export default function Page(){
  const[d,setD]=useState<any>();const[e,setE]=useState('');
  useEffect(()=>{fetchAdminReports().then(r=>r.success?setD(r.data):setE(r.error?.message||'Unable to load reports.'))},[]);
  const items=useMemo(()=>{if(!d)return[];return[
    ...(d.postReports||[]).map((x:any)=>({...x,type:'Post',reportType:'post',target:x.post?.content||'Post',targetUser:x.post?.user})),
    ...(d.userReports||[]).map((x:any)=>({...x,type:'User',reportType:'user',target:x.reported?.displayName||x.reported?.username||'User',targetUser:x.reported})),
    ...(d.commentReports||[]).map((x:any)=>({...x,type:'Comment',reportType:'comment',target:x.comment?.content||'Comment',targetUser:x.comment?.user,context:x.comment?.post})),
    ...(d.reelCommentReports||[]).map((x:any)=>({...x,type:'Reel comment',reportType:'reel-comment',target:x.comment?.content||'Comment',targetUser:x.comment?.user,context:x.comment?.reel}))
  ].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())},[d]);
  async function removeReport(r:any){if(!window.confirm('Delete this report?'))return;const z=await deleteAdminReport(r.reportType,r.id);if(z.success)setD((x:any)=>({...x,
    postReports:r.reportType==='post'?(x.postReports||[]).filter((q:any)=>q.id!==r.id):x.postReports,
    userReports:r.reportType==='user'?(x.userReports||[]).filter((q:any)=>q.id!==r.id):x.userReports,
    commentReports:r.reportType==='comment'?(x.commentReports||[]).filter((q:any)=>q.id!==r.id):x.commentReports,
    reelCommentReports:r.reportType==='reel-comment'?(x.reelCommentReports||[]).filter((q:any)=>q.id!==r.id):x.reelCommentReports}));else setE(z.error?.message||'Unable to delete report.')}
  async function removeComment(id:string){if(!window.confirm('Delete this reported comment?'))return;const z=await deleteAdminComment(id);if(z.success)setD((x:any)=>({...x,commentReports:(x.commentReports||[]).filter((q:any)=>q.comment?.id!==id),reelCommentReports:(x.reelCommentReports||[]).filter((q:any)=>q.comment?.id!==id)}));else setE(z.error?.message||'Unable to delete comment.')}
  return <div className="space-y-5"><div><h2 className="text-2xl font-bold">Reports</h2><p className="mt-1 text-sm text-slate-500">Review who reported, why they reported, and exactly what was reported.</p></div>{e&&<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{e}</div>}<div className="space-y-3">{items.map((r:any)=><div key={r.type+r.id} className="rounded-2xl border bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{r.type}</span><h3 className="mt-2 font-semibold">{r.reason}</h3></div><span className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</span></div><p className="mt-3 text-xs text-slate-500">Reported by: <span className="font-semibold text-slate-700">{r.reporter?.displayName||r.reporter?.username||'Unknown user'}</span></p><p className="mt-1 text-xs text-slate-500">Reported user/author: <span className="font-semibold text-slate-700">{r.targetUser?.displayName||r.targetUser?.username||'N/A'}</span></p><div className="mt-3 rounded-xl bg-slate-50 p-3"><p className="text-sm font-medium text-slate-800">{r.target}</p>{r.context?.content&&<p className="mt-1 text-xs text-slate-500">Post: {r.context.content}</p>}</div>{r.details&&<p className="mt-2 text-xs text-slate-500">Details: {r.details}</p>}<div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>removeReport(r)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700">Delete report</button>{(r.type==='Comment'||r.type==='Reel comment')&&<button onClick={()=>removeComment(r.comment.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700">Delete reported comment</button>}</div></div>)}{!items.length&&<div className="rounded-2xl border bg-white p-10 text-center text-sm text-slate-500">No reports found.</div>}</div></div>}
