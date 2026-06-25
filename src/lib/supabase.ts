// Client-side wrapper for Supabase client emulation that directs to local Next.js APIs.

class SupabaseQueryBuilder {
  private table: string;
  private method: string = 'GET';
  private body: any = null;
  private filters: Record<string, string> = {};
  private orderCol: string = '';
  private orderDir: string = 'ASC';
  private singleRow: boolean = false;
  private maybeSingleRow: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    // We select all in our backend by default
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = String(value);
    return this;
  }

  order(column: string, options?: { ascending: boolean }) {
    this.orderCol = column;
    this.orderDir = options?.ascending === false ? 'DESC' : 'ASC';
    return this;
  }

  single() {
    this.singleRow = true;
    return this.execute();
  }

  maybeSingle() {
    this.maybeSingleRow = true;
    return this.execute();
  }

  insert(data: any): any {
    this.method = 'POST';
    this.body = data;
    return {
      select: () => ({
        single: () => {
          this.singleRow = true;
          return this.execute();
        }
      }),
      then: (resolve: any) => this.execute().then(resolve)
    };
  }

  upsert(data: any): any {
    this.method = 'POST';
    this.body = data;
    return {
      then: (resolve: any) => this.execute(true).then(resolve)
    };
  }

  update(data: any) {
    this.method = 'PATCH';
    this.body = data;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  async then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    try {
      const result = await this.execute();
      return onfulfilled ? onfulfilled(result) : result;
    } catch (err) {
      if (onrejected) return onrejected(err);
      throw err;
    }
  }

  private async execute(isUpsert = false) {
    try {
      const url = new URL(`/api/db/${this.table}`, window.location.origin);
      
      const filterKeys = Object.keys(this.filters);
      if (filterKeys.length > 0) {
        url.searchParams.append('filter_col', filterKeys[0]);
        url.searchParams.append('filter_val', this.filters[filterKeys[0]]);
      }

      if (this.orderCol) {
        url.searchParams.append('order_col', this.orderCol);
        url.searchParams.append('order_dir', this.orderDir);
      }

      if (this.singleRow) {
        url.searchParams.append('single', 'true');
      }

      if (this.maybeSingleRow) {
        url.searchParams.append('maybe_single', 'true');
      }

      if (isUpsert) {
        url.searchParams.append('upsert', 'true');
      }

      const res = await fetch(url.toString(), {
        method: this.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: this.body ? JSON.stringify(this.body) : undefined
      });

      const data = await res.json();
      if (!res.ok) {
        return { data: null, error: { message: data.error || 'Database operation failed' } };
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Network error' } };
    }
  }
}

export const supabase = {
  auth: {
    getSession: async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.session) {
          return { data: { session: data.session }, error: null };
        }
        return { data: { session: null }, error: null };
      } catch (err: any) {
        return { data: { session: null }, error: err };
      }
    },
    
    getUser: async (token?: string) => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/auth/session', { headers });
        const data = await res.json();
        if (data.session?.user) {
          return { data: { user: data.session.user }, error: null };
        }
        return { data: { user: null }, error: new Error('User not found') };
      } catch (err: any) {
        return { data: { user: null }, error: err };
      }
    },

    signInWithPassword: async ({ email, password }: any) => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Login gagal');
        }
        return { 
          data: { 
            session: data.session, 
            user: data.session.user 
          }, 
          error: null 
        };
      } catch (err: any) {
        return { data: { session: null, user: null }, error: err };
      }
    },

    signUp: async ({ email, password }: any) => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Registrasi gagal');
        }
        return { 
          data: { 
            user: { 
              id: data.userId, 
              email: email 
            } 
          }, 
          error: null 
        };
      } catch (err: any) {
        return { data: { user: null }, error: err };
      }
    },

    signOut: async () => {
      try {
        const res = await fetch('/api/auth/logout', {
          method: 'POST'
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal logout');
        }
        return { error: null };
      } catch (err: any) {
        return { error: err };
      }
    },

    resetPasswordForEmail: async (email: string, options?: any) => {
      try {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal mengirim link reset');
        }
        return { data, error: null };
      } catch (err: any) {
        return { data: null, error: err };
      }
    }
  },

  from: (table: string) => {
    return new SupabaseQueryBuilder(table);
  }
};
