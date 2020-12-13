export interface User {
  is_bot: boolean;
  name: string;
  profile: {
       real_name: string; 
       title: any 
   };
  id: any;
}