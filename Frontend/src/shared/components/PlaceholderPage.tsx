import { Card, Typography } from "antd";
import styles from "./layout/adminLayout.module.css";

interface AdminPageProps {
  title: string;
  description: string;
}

const AdminPage = ({ title, description }: AdminPageProps) => {
  return (
    <Card bordered={false} className={styles.pageCard}>
      <Typography.Title level={3} className={styles.pageTitle}>
        {title}
      </Typography.Title>
      <Typography.Paragraph className={styles.pageDescription}>{description}</Typography.Paragraph>
    </Card>
  );
};

export default AdminPage;
