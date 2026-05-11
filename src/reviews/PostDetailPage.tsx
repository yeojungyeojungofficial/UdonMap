import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useRef, useState } from "react";
import TopNav from "@/src/shared/components/TopNav";
import styles from "@/src/reviews/PostDetailPage.module.css";

// ─────────────────────────── 타입 ────────────────────────────

type Reply = {
  id: string;
  author: string;
  avatarColor: string;
  content: string;
  createdAt: string;
};

type Comment = {
  id: string;
  author: string;
  avatarColor: string;
  content: string;
  createdAt: string;
  replies: Reply[];
};

type PostDetail = {
  id: string;
  board: string;
  title: string;
  author: string;
  avatarColor: string;
  createdAt: string;
  region?: string;
  likes: number;
  content: string;
  comments: Comment[];
};

// ─────────────────────────── 더미 데이터 ────────────────────────────

const POSTS_DETAIL: Record<string, PostDetail> = {
  "review-1": {
    id: "review-1",
    board: "병원후기 게시판",
    title: "서울에서 파충류 진료 가능한 병원 다녀온 후기",
    author: "파충류집사",
    avatarColor: "#4caf82",
    createdAt: "2026.05.08",
    region: "서울",
    likes: 38,
    content: `얼마 전에 제가 키우는 볼파이손이 밥을 안 먹고 힘이 없어서 급하게 병원을 찾았어요.

서울에서 파충류 전문으로 봐주는 곳이 많지 않은데, 강남 쪽에 있는 ○○동물병원에서 특수동물 외래를 운영한다고 해서 예약하고 다녀왔습니다.

예약은 네이버 예약으로 했고, 대기 없이 바로 진료받을 수 있었어요. 선생님이 파충류 경험이 많으신 분이라 촉감만으로도 장 상태를 꽤 정확하게 파악하시더라고요.

엑스레이 촬영도 해주셨고, 소화불량 + 약간의 탈수 소견이 있다고 하셔서 수액 처치 + 약 처방받아 왔습니다. 지금은 거의 회복해서 밥도 잘 먹고 있어요 😊

처음 파충류 병원 찾는 분들께 도움이 됐으면 해서 적어봤습니다!`,
    comments: [
      {
        id: "c1",
        author: "뱀덕후",
        avatarColor: "#e87d4e",
        content: "어느 병원인지 알 수 있을까요? 저도 볼파이손 키우는데 마땅한 병원을 못 찾고 있어서요 ㅠ",
        createdAt: "2026.05.08",
        replies: [
          {
            id: "c1-r1",
            author: "파충류집사",
            avatarColor: "#4caf82",
            content: "DM 드릴게요! 공개적으로 올리기가 조금 조심스러워서요 😅",
            createdAt: "2026.05.08",
          },
        ],
      },
      {
        id: "c2",
        author: "도마뱀친구",
        avatarColor: "#7c6fff",
        content: "회복했다니 다행이에요! 저도 비슷한 경험이 있어서 공감됩니다. 후기 올려주셔서 감사해요.",
        createdAt: "2026.05.09",
        replies: [],
      },
      {
        id: "c3",
        author: "특수동물연구",
        avatarColor: "#e0a020",
        content: "파충류 진료 가능 병원 목록을 지역별로 정리하는 분들이 있던데, 여기 게시판에 공유해도 좋을 것 같아요.",
        createdAt: "2026.05.10",
        replies: [],
      },
    ],
  },
  "review-2": {
    id: "review-2",
    board: "병원후기 게시판",
    title: "부산 조류 진료 병원 예약부터 진료까지 정리",
    author: "앵무새아빠",
    avatarColor: "#3b9fe0",
    createdAt: "2026.05.06",
    region: "부산",
    likes: 24,
    content: `부산에서 아프리카 회색앵무 키우고 있는 사람입니다. 최근에 털 뽑기가 심해져서 병원을 찾게 됐어요.

부산에 조류 전문 진료를 해주는 곳이 몇 군데 없어서 발품을 꽤 팔았습니다. 결국 해운대 근처 병원에서 진료를 받았는데, 예약 방법부터 정리해 드릴게요.

1. 전화 예약 필수 (온라인 예약 없음)
2. 초진 기준 1~2주 대기
3. 진료비는 기본 진찰료 + 검사비 별도

진료 시 깃털 샘플 채취 + 혈액검사를 했고, 스트레스성 깃털 뽑기로 진단받았습니다. 환경 개선 + 영양제 처방으로 현재 많이 나아지고 있어요.`,
    comments: [
      {
        id: "c4",
        author: "버드워처",
        avatarColor: "#54b060",
        content: "진료비가 어느 정도 나왔나요? 참고하려고요.",
        createdAt: "2026.05.07",
        replies: [
          {
            id: "c4-r1",
            author: "앵무새아빠",
            avatarColor: "#3b9fe0",
            content: "초진 기준으로 진찰 + 혈액검사 합쳐서 8만원대였어요.",
            createdAt: "2026.05.07",
          },
        ],
      },
    ],
  },
  "review-3": {
    id: "review-3",
    board: "병원후기 게시판",
    title: "경기권 햄스터 진료 가능한 병원 후기",
    author: "햄찌엄마",
    avatarColor: "#f06292",
    createdAt: "2026.05.04",
    region: "경기",
    likes: 19,
    content: `경기도에서 햄스터 4마리 키우고 있어요. 그 중 한 마리가 눈이 빨개지고 눈물을 흘려서 병원에 다녀왔습니다.

검색해보니 일반 동물병원에서는 잘 안 봐주는 경우가 있다고 해서 걱정했는데, 수원 쪽 특수동물 진료 가능 병원에서 친절하게 봐주셨어요.

결막염 진단을 받았고 안약 처방받아 왔습니다. 3일 만에 눈이 깨끗해졌어요.`,
    comments: [],
  },
  "free-1": {
    id: "free-1",
    board: "자유게시판",
    title: "특수동물 이동장 추천받고 싶어요",
    author: "이구아나친구",
    avatarColor: "#26a69a",
    createdAt: "2026.05.10",
    likes: 17,
    content: `안녕하세요! 이구아나(약 50cm)를 데리고 병원을 가야 하는데 적당한 이동장을 못 찾겠어요.

현재 사용 중인 건 고양이용 캐리어인데, 좁기도 하고 이구아나가 스트레스를 많이 받는 것 같아서요.

쓰고 계신 이동장 있으시면 브랜드나 사이즈 추천해 주세요!`,
    comments: [
      {
        id: "c5",
        author: "파충류마을",
        avatarColor: "#ff8f00",
        content: "저는 다이소 대형 수납함에 통풍구 뚫어서 쓰고 있어요. 저렴하고 가볍습니다.",
        createdAt: "2026.05.10",
        replies: [],
      },
      {
        id: "c6",
        author: "렙타일러버",
        avatarColor: "#e53935",
        content: "아마존에서 mesh 소재 파충류 전용 캐리어 구매했어요. 사이즈 다양해서 좋았습니다.",
        createdAt: "2026.05.10",
        replies: [
          {
            id: "c6-r1",
            author: "이구아나친구",
            avatarColor: "#26a69a",
            content: "혹시 어떤 제품인지 링크 공유해 주실 수 있나요?",
            createdAt: "2026.05.10",
          },
          {
            id: "c6-r2",
            author: "렙타일러버",
            avatarColor: "#e53935",
            content: "검색창에 'reptile carrier bag large' 치시면 나와요!",
            createdAt: "2026.05.10",
          },
        ],
      },
    ],
  },
  "free-2": {
    id: "free-2",
    board: "자유게시판",
    title: "동네 병원 정보는 어디서 확인하시나요?",
    author: "고슴도치집사",
    avatarColor: "#8d6e63",
    createdAt: "2026.05.09",
    likes: 11,
    content: `특수동물 진료 가능한 병원 정보를 모아놓은 곳이 있나요?

저는 고슴도치를 키우는데 근처 병원 중에 어디서 봐주는지 알기가 너무 어렵더라고요. 전화해서 물어봐야 하는 것도 번거롭고요.

이 앱처럼 지도로 볼 수 있는 곳이 있으면 좋겠는데, 다들 어떻게 정보 수집하시나요?`,
    comments: [],
  },
  "tip-1": {
    id: "tip-1",
    board: "꿀팁 게시판",
    title: "초진 전에 챙기면 좋은 진료 기록 목록",
    author: "수의사친구",
    avatarColor: "#1565c0",
    createdAt: "2026.05.07",
    likes: 42,
    content: `특수동물 병원 초진 시 미리 준비하면 도움이 되는 정보들을 정리했습니다.

**기본 정보**
- 동물 종류 / 품종
- 나이 (부화일 또는 입양일)
- 성별
- 체중 (최근 측정값)

**사육 환경**
- 케이지 크기 / 종류
- 온도 및 습도 설정값
- UVB 조명 사용 여부 (파충류)
- 최근 환경 변화 유무

**식이 정보**
- 주식 / 간식 종류
- 급여 주기 및 양
- 마지막 식사 일시

**증상 정보**
- 언제부터 이상 증상이 있었는지
- 영상 또는 사진 (가능하면)
- 배변 상태 변화 여부

미리 메모해서 가시면 진료 시간이 훨씬 절약됩니다!`,
    comments: [
      {
        id: "c7",
        author: "토끼엄마",
        avatarColor: "#ec407a",
        content: "저장해뒀습니다! 진짜 유용한 정보 감사해요.",
        createdAt: "2026.05.07",
        replies: [],
      },
      {
        id: "c8",
        author: "도마뱀친구",
        avatarColor: "#7c6fff",
        content: "체중 기록은 정말 중요한데 놓치기 쉬운 것 같아요. 저도 이번에 까먹고 갔다가 선생님이 따로 재주셨어요 😅",
        createdAt: "2026.05.08",
        replies: [],
      },
    ],
  },
  "tip-2": {
    id: "tip-2",
    board: "꿀팁 게시판",
    title: "응급 상황에서 병원에 먼저 말해야 할 정보",
    author: "수의사친구",
    avatarColor: "#1565c0",
    createdAt: "2026.05.05",
    likes: 31,
    content: `응급 상황에서 전화를 걸 때 당황하지 않도록 미리 알아두세요.

전화 연결 후 가장 먼저 말해야 할 것들:

1. **동물 종류와 크기** - "볼파이손 성체입니다" 처럼 빠르게
2. **증상 요약** - "갑자기 쓰러지고 경련을 해요" 등 핵심만
3. **얼마나 됐는지** - "30분 전부터요"
4. **현재 의식/반응** - 있는지 없는지

병원 측에서 응급 여부 판단 + 준비를 위해 위 정보가 필요합니다. 당황하면 말이 안 나오니까 메모해두세요!`,
    comments: [],
  },
};

// ─────────────────────────── 아바타 컴포넌트 ────────────────────────────

function Avatar({ name, color }: { name: string; color: string }) {
  return (
    <span className={styles.avatar} style={{ background: color }}>
      {name.slice(0, 1)}
    </span>
  );
}

// ─────────────────────────── 대댓글 아이템 ────────────────────────────

function ReplyItem({ reply }: { reply: Reply }) {
  return (
    <div className={styles.replyItem}>
      <Avatar name={reply.author} color={reply.avatarColor} />
      <div className={styles.commentBody}>
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>{reply.author}</span>
          <span className={styles.commentDate}>{reply.createdAt}</span>
        </div>
        <p className={styles.commentContent}>{reply.content}</p>
      </div>
    </div>
  );
}

// ─────────────────────────── 댓글 아이템 ────────────────────────────

function CommentItem({
  comment,
  onAddReply,
}: {
  comment: Comment;
  onAddReply: (commentId: string, content: string) => void;
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const replyInputRef = useRef<HTMLTextAreaElement>(null);

  const handleOpenReply = () => {
    setIsReplying(true);
    setTimeout(() => replyInputRef.current?.focus(), 40);
  };

  const handleSubmitReply = () => {
    if (!replyText.trim()) return;
    onAddReply(comment.id, replyText.trim());
    setReplyText("");
    setIsReplying(false);
  };

  return (
    <div className={styles.commentItem}>
      <Avatar name={comment.author} color={comment.avatarColor} />
      <div className={styles.commentBody}>
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>{comment.author}</span>
          <span className={styles.commentDate}>{comment.createdAt}</span>
        </div>
        <p className={styles.commentContent}>{comment.content}</p>
        <button
          type="button"
          className={styles.replyToggleButton}
          onClick={handleOpenReply}
        >
          답글 달기
        </button>

        {comment.replies.length > 0 && (
          <div className={styles.replyList}>
            {comment.replies.map((reply) => (
              <ReplyItem key={reply.id} reply={reply} />
            ))}
          </div>
        )}

        {isReplying && (
          <div className={styles.replyInputRow}>
            <textarea
              ref={replyInputRef}
              className={styles.replyInputTextarea}
              placeholder="답글을 입력해 주세요"
              value={replyText}
              rows={2}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmitReply();
                }
              }}
            />
            <div className={styles.replyInputActions}>
              <button
                type="button"
                className={styles.replyCancel}
                onClick={() => {
                  setReplyText("");
                  setIsReplying(false);
                }}
              >
                취소
              </button>
              <button
                type="button"
                className={styles.replySubmit}
                disabled={!replyText.trim()}
                onClick={handleSubmitReply}
              >
                등록
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── 메인 페이지 ────────────────────────────

export default function PostDetailPage() {
  const router = useRouter();
  const { postId } = router.query;

  const [activeMenu, setActiveMenu] = useState("병원후기");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [postLikes, setPostLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  const post = postId ? POSTS_DETAIL[postId as string] : null;

  // post가 로드되면 댓글 초기화
  const [initialized, setInitialized] = useState(false);
  if (post && !initialized) {
    setComments(post.comments);
    setPostLikes(post.likes);
    setInitialized(true);
  }

  if (router.isFallback || !post) {
    return (
      <div className={styles.page}>
        <TopNav activeMenu={activeMenu} onSelectMenu={setActiveMenu} onOpenReport={() => {}} />
        <main className={styles.notFound}>
          <p>게시글을 찾을 수 없어요.</p>
          <Link href="/reviews" className={styles.backLink}>목록으로 돌아가기</Link>
        </main>
      </div>
    );
  }

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: Comment = {
      id: `local-${Date.now()}`,
      author: "나",
      avatarColor: "#ff9645",
      content: commentText.trim(),
      createdAt: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(".", ""),
      replies: [],
    };
    setComments((prev) => [...prev, newComment]);
    setCommentText("");
  };

  const handleAddReply = (commentId: string, content: string) => {
    const newReply: Reply = {
      id: `local-reply-${Date.now()}`,
      author: "나",
      avatarColor: "#ff9645",
      content,
      createdAt: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, ".").replace(".", ""),
    };
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, replies: [...c.replies, newReply] } : c,
      ),
    );
  };

  const handleLike = () => {
    if (liked) {
      setPostLikes((n) => n - 1);
    } else {
      setPostLikes((n) => n + 1);
    }
    setLiked((v) => !v);
  };

  return (
    <>
      <Head>
        <title>{post.title} | 우동</title>
        <meta name="description" content={post.content.slice(0, 80)} />
      </Head>

      <div className={styles.page}>
        <TopNav activeMenu={activeMenu} onSelectMenu={setActiveMenu} onOpenReport={() => {}} />

        <main className={styles.content}>
          {/* 뒤로가기 */}
          <div className={styles.topRow}>
            <Link href="/reviews" className={styles.backButton} aria-label="목록으로">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" fill="currentColor" />
              </svg>
              목록으로
            </Link>
            <div className={styles.topBadges}>
              <span className={styles.boardBadge}>{post.board}</span>
              {post.region && (
                <span className={styles.regionBadge}>{post.region}</span>
              )}
            </div>
          </div>

          {/* 게시글 헤더 */}
          <header className={styles.postHeader}>
            <h1 className={styles.postTitle}>{post.title}</h1>
            <div className={styles.postMeta}>
              <Avatar name={post.author} color={post.avatarColor} />
              <span className={styles.postAuthor}>{post.author}</span>
              <span className={styles.postDate}>{post.createdAt}</span>
            </div>
          </header>

          {/* 본문 */}
          <article className={styles.postContent}>
            {post.content.split("\n").map((line, i) => {
              if (line.trim() === "") return <br key={i} />;
              const bold = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
              return (
                <p
                  key={i}
                  className={styles.contentParagraph}
                  dangerouslySetInnerHTML={{ __html: bold }}
                />
              );
            })}
          </article>

          {/* 좋아요 */}
          <div className={styles.postActions}>
            <button
              type="button"
              className={`${styles.likeButton} ${liked ? styles.likeButtonActive : ""}`}
              onClick={handleLike}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={liked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={liked ? 0 : 2}
                />
              </svg>
              좋아요 {postLikes}
            </button>
          </div>

          <div className={styles.sectionDivider} />

          {/* 댓글 영역 */}
          <section className={styles.commentSection}>
            <h2 className={styles.commentSectionTitle}>
              댓글 <span className={styles.commentCount}>{comments.length}</span>
            </h2>

            {/* 댓글 입력창 — 목록 위 */}
            <div className={styles.commentInputBox}>
              <textarea
                className={styles.commentInputTextarea}
                placeholder="댓글을 입력해 주세요"
                value={commentText}
                rows={2}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <div className={styles.commentInputActions}>
                <button
                  type="button"
                  className={styles.commentSubmitButton}
                  disabled={!commentText.trim()}
                  onClick={handleAddComment}
                >
                  등록
                </button>
              </div>
            </div>

            {comments.length === 0 && (
              <p className={styles.emptyComments}>첫 번째 댓글을 남겨보세요!</p>
            )}

            <div className={styles.commentList}>
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onAddReply={handleAddReply}
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
