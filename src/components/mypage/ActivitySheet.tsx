import {
  COMMENT_STATUS_LABELS,
  REPORT_STATUS_LABELS,
} from "@/src/features/mypage/activityLabels";
import type {
  ActivityTab,
  MyComment,
  MyPost,
  MyReport,
} from "@/src/features/mypage/types";
import LoadingScreen from "@/src/components/common/LoadingScreen";
import { formatProfileDate } from "@/src/features/mypage/formatters";
import styles from "@/src/components/mypage/MyPage.module.css";

type ActivitySheetProps = {
  activeTab: ActivityTab;
  comments: MyComment[];
  error: string;
  isLoading: boolean;
  onClose: () => void;
  onTabChange: (tab: ActivityTab) => void;
  posts: MyPost[];
  reports: MyReport[];
};

export default function ActivitySheet({
  activeTab,
  comments,
  error,
  isLoading,
  onClose,
  onTabChange,
  posts,
  reports,
}: ActivitySheetProps) {
  return (
    <div className={styles.sheetBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.bookmarkSheet}
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.sheetHandle} />
        <div className={styles.bookmarkSheetHeader}>
          <div>
            <h2 id="activity-sheet-title">내 활동 내역</h2>
            <p>
              제보 {reports.length}개 · 게시글 {posts.length}개 · 댓글{" "}
              {comments.length}개
            </p>
          </div>
          <button
            type="button"
            className={styles.sheetCloseButton}
            onClick={onClose}
            aria-label="내 활동 내역 닫기"
          >
            닫기
          </button>
        </div>

        <div className={styles.activityTabs} aria-label="활동 내역 구분">
          <button
            type="button"
            className={`${styles.activityTab} ${
              activeTab === "reports" ? styles.activityTabActive : ""
            }`}
            aria-pressed={activeTab === "reports"}
            onClick={() => onTabChange("reports")}
          >
            내 제보
          </button>
          <button
            type="button"
            className={`${styles.activityTab} ${
              activeTab === "posts" ? styles.activityTabActive : ""
            }`}
            aria-pressed={activeTab === "posts"}
            onClick={() => onTabChange("posts")}
          >
            내 게시글
          </button>
          <button
            type="button"
            className={`${styles.activityTab} ${
              activeTab === "comments" ? styles.activityTabActive : ""
            }`}
            aria-pressed={activeTab === "comments"}
            onClick={() => onTabChange("comments")}
          >
            내 댓글
          </button>
        </div>

        {isLoading ? (
          <LoadingScreen
            message="내 활동 내역을 불러오는 중입니다."
            variant="inline"
          />
        ) : null}

        {error ? <p className={styles.bookmarkError}>{error}</p> : null}

        {!isLoading &&
        !error &&
        activeTab === "reports" &&
        reports.length === 0 ? (
          <p className={styles.bookmarkState}>아직 제보 내역이 없습니다.</p>
        ) : null}

        {!isLoading && !error && activeTab === "posts" && posts.length === 0 ? (
          <p className={styles.bookmarkState}>아직 작성한 게시글이 없습니다.</p>
        ) : null}

        {!isLoading &&
        !error &&
        activeTab === "comments" &&
        comments.length === 0 ? (
          <p className={styles.bookmarkState}>아직 작성한 댓글이 없습니다.</p>
        ) : null}

        {!isLoading && !error && activeTab === "reports" && reports.length > 0 ? (
          <ul className={styles.activityList}>
            {reports.map((report) => (
              <li key={report.id} className={styles.activityItem}>
                <div className={styles.activityMeta}>
                  <span>{formatProfileDate(report.createdAt)}</span>
                  <em>{REPORT_STATUS_LABELS[report.status]}</em>
                </div>
                <strong>{report.hospitalName}</strong>
                <p>{report.address}</p>
                {report.details ? (
                  <p className={styles.activityBody}>{report.details}</p>
                ) : null}
                <div className={styles.bookmarkTags}>
                  {report.animalCategories.map((animal) => (
                    <em key={`${report.id}-${animal}`}>{animal}</em>
                  ))}
                  {report.animalSpecies ? <em>{report.animalSpecies}</em> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {!isLoading && !error && activeTab === "posts" && posts.length > 0 ? (
          <ul className={styles.activityList}>
            {posts.map((post) => (
              <li key={post.id} className={styles.activityItem}>
                <div className={styles.activityMeta}>
                  <span>{formatProfileDate(post.createdAt)}</span>
                  <em>{post.board}</em>
                </div>
                <strong>{post.title}</strong>
              </li>
            ))}
          </ul>
        ) : null}

        {!isLoading &&
        !error &&
        activeTab === "comments" &&
        comments.length > 0 ? (
          <ul className={styles.activityList}>
            {comments.map((comment) => (
              <li key={comment.id} className={styles.activityItem}>
                <div className={styles.activityMeta}>
                  <span>{formatProfileDate(comment.createdAt)}</span>
                  <em>{COMMENT_STATUS_LABELS[comment.status]}</em>
                </div>
                <strong>{comment.hospitalName}</strong>
                {comment.hospitalAddress ? <p>{comment.hospitalAddress}</p> : null}
                <p className={styles.activityBody}>{comment.content}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
