import os
import pymysql
from dotenv import load_dotenv


def main() -> None:
    # load env from .flaskenv so credentials are available when running directly
    load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.flaskenv'))
    user = os.getenv('MYSQL_USER', 'root')
    password = os.getenv('MYSQL_PASSWORD', '')
    host = os.getenv('MYSQL_HOST', '127.0.0.1')
    port = int(os.getenv('MYSQL_PORT', '3306'))
    db_name = os.getenv('MYSQL_DB', 'my_fyp_database')

    conn = pymysql.connect(host=host, user=user, password=password, port=port, database='mysql')
    try:
        with conn.cursor() as cur:
            cur.execute(
                f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
            )
        conn.commit()
    finally:
        conn.close()


if __name__ == '__main__':
    main()


